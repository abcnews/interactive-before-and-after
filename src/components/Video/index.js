const terminusFetch = require('@abcnews/terminus-fetch');
const { h, Component } = require('preact');
const styles = require('./styles.scss').default;

function pickImageURL(images) {
  return (images.filter(image => image.ratio === '16x9').sort((a, b) => b.size - a.size)[0] || {}).url;
}

function getSources(doc) {
  return doc.media.video.renditions.files
    .sort((a, b) => +b.bitRate - +a.bitRate)
    .map(rendition => ({
      src: rendition.src || rendition.url,
      size: +rendition.size,
      width: +rendition.width || 0,
      height: +rendition.height || 0
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
      this.setState(() => ({ sources: this.props.sources }));
      this.props.onLoad(this.props.sources);
    } else {
      terminusFetch({ id: this.props.videoId, type: 'video' })
      .then(doc => this.setState(
        () => ({
          imageUrl: doc._embedded && doc._embedded.mediaThumbnail ?
            pickImageURL(doc._embedded.mediaThumbnail.complete) :
            '',
          sources: getSources(doc)
        }),
        () => this.props.onLoad(this.state.sources)
      ))
      .catch(err => console.log('ERROR:', err));
    }
  }

  render({ posterUrl, width, height }) {
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
        {this.state.sources.map(s => (<source src={s.src} type="video/mp4" />))}
      </video>
    );
  }
}

Video.defaultProps = {
  onRef: () => {},
  onLoad: () => {}
};

module.exports = Video;
