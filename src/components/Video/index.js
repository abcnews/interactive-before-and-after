const { h, Component } = require('preact');
const styles = require('./styles.scss');

function formatSources(sources, sortProp = 'bitrate') {
  return sources.sort((a, b) => +b[sortProp] - +a[sortProp]).map(source => ({
    src: source.src || source.url,
    type: source.type || source.contentType,
    width: +source.width || 0,
    height: +source.height || 0
  }));
}

class Video extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sources: []
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.sources.length !== nextState.sources.length) return true;
    if (this.props.height !== nextProps.height) return;
    if (this.props.width !== nextProps.width) return;
    return false;
  }

  componentDidMount() {
    // load the video
    if (this.props.sources) {
      this.setState(state => ({ sources: this.props.sources }));
      this.props.onLoad(this.props.sources);
    } else {
      const URL = `${(window.location.origin || '').replace('mobile', 'www')}/news/${this.props.videoId}?pfm=ms`;
      fetch(URL, {
        credentials: 'same-origin'
      })
        .then(r => r.text())
        .then(html => {
          this.setState(
            state => {
              const doc = new DOMParser().parseFromString(html, 'text/html');

              if (html.indexOf('WCMS.pluginCache') > -1) {
                // Phase 2
                // * Poster can be selected from the DOM
                // * Sources can be parsed from JS that would nest them under the global `WCMS` object
                return {
                  imageUrl: doc
                    .querySelector('.view-inlineMediaPlayer img')
                    .getAttribute('src')
                    .replace('-thumbnail', '-large'),
                  sources: formatSources(
                    JSON.parse(html.replace(/\r?\n/, '').match(/"sources":(\[.*\]),"addDownload"/)[1])
                  )
                };
              } else if (html.indexOf('inlineVideoData') > -1) {
                // Phase 1 (Standard)
                // * Poster can be selected from the DOM
                // * Sources can be parsed from JS that would nest them under the global `inlineVideoData` object
                return {
                  imageUrl: doc.querySelector('.inline-video img').getAttribute('src'),
                  sources: formatSources(
                    JSON.parse(
                      html
                        .replace(/\r?\n/g, '')
                        .match(/inlineVideoData\.push\((\[.*\])\)/)[1]
                        .replace(/'/g, '"')
                    )
                  )
                };
              }
            },
            () => {
              this.props.onLoad(this.state.sources);
            }
          );
        })
        .catch(err => {
          console.log('ERROR:', err);
        });
    }
  }

  render({ videoId, posterUrl, width, height }) {
    return (
      <video
        className={styles.base}
        ref={this.props.onRef}
        poster={this.state.imageUrl || posterUrl}
        width={width}
        height={height}
        autoPlay
        loop
        muted
        defaultmuted
        playsinline
        onLoad={this.props.onLoad}>
        {this.state.sources.map(s => {
          return <source src={s.src} type={s.type} />;
        })}
      </video>
    );
  }
}

Video.defaultProps = {
  onRef: () => {},
  onLoad: () => {}
};

module.exports = Video;
