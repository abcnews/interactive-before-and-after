const { h, Component } = require('preact');

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
    return this.state.sources.length !== nextState.sources.length;
  }

  componentDidMount() {
    // load the video
    if (this.props.sources) {
      this.setState(state => ({ sources: this.props.sources }));
    } else {
      const URL = `${(window.location.origin || '').replace('mobile', 'www')}/news/${this.props.videoId}?pfm=ms`;
      fetch(URL)
        .then(r => r.text())
        .then(html => {
          this.setState(state => {
            if (html.indexOf('WCMS.pluginCache') > -1) {
              // Phase 2
              // * Poster can be selected from the DOM
              // * Sources can be parsed from JS that would nest them under the global `WCMS` object
              return {
                sources: formatSources(
                  JSON.parse(html.replace(/\r?\n/, '').match(/"sources":(\[.*\]),"addDownload"/)[1])
                )
              };
            } else if (html.indexOf('inlineVideoData') > -1) {
              // Phase 1 (Standard)
              // * Poster can be selected from the DOM
              // * Sources can be parsed from JS that would nest them under the global `inlineVideoData` object
              return {
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
          });
        })
        .catch(err => {
          console.log('ERROR:', err);
        });
    }
  }

  render({ videoId, posterUrl, width, height, muted }) {
    return (
      <video
        ref={this.props.onRef}
        poster={posterUrl}
        width={width}
        height={height}
        autoPlay={false}
        loop={true}
        muted={muted}
        onLoad={this.props.onLoad}>
        {this.state.sources.map(s => {
          return <source src={s.src} type={s.type} />;
        })}
      </video>
    );
  }
}

module.exports = Video;
