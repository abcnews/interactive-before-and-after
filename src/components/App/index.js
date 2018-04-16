const { h, Component } = require('preact');
const styles = require('./styles.scss');
const Video = require('../Video');

class App extends Component {
  constructor(props) {
    super(props);

    this.onMouseMove = this.onMouseMove.bind(this);

    this.onRef = this.onRef.bind(this);
    this.onVideoReady = this.onVideoReady.bind(this);
    this.onVideoPlay = this.onVideoPlay.bind(this);
    this.sync = this.sync.bind(this);

    this.state = {
      clipX: 0
    };

    this.videosLoaded = 0;
    this.videoRefs = {};
  }

  componentDidMount() {
    const { before, beforeCaption, after, afterCaption } = this.props.beforeAndAfter;

    this.captions.appendChild(before.captionNode);
    this.captions.appendChild(after.captionNode);

    this.base.addEventListener('mousemove', this.onMouseMove);
  }

  componentWillUnmount() {
    const { before, after } = this.props.beforeAndAfter;

    this.captions.removeChild(before.captionNode);
    this.captions.removeChild(after.captionNode);

    this.base.removeEventListener('mousemove', this.onMouseMove);

    this.videoRefs.before.removeEventListener('canplaythrough', this.onVideoReady);
    this.videoRefs.before.removeEventListener('play', this.onVideoPlay);
    this.videoRefs.before = null;
    this.videoRefs.after.removeEventListener('canplaythrough', this.onVideoReady);
    this.videoRefs.after = null;
  }

  onMouseMove(event) {
    const { left } = this.base.getBoundingClientRect();
    const { clientX } = event;

    this.setState(state => {
      return {
        clipX: clientX - left
      };
    });
  }

  onRef(which, element) {
    if (!element) return;

    element.addEventListener('canplaythrough', this.onVideoReady);
    this.videoRefs[which] = element;
  }

  onVideoReady() {
    if (++this.videosLoaded !== 2) return;

    this.videoRefs.before.addEventListener('play', this.onVideoPlay);
    this.videoRefs.before.play();

    this.sync();
  }

  onVideoPlay() {
    if (this.videosLoaded < 2) return;

    this.videoRefs.after.play();
  }

  sync() {
    if (this.videosLoaded < 2) return;
    if (this.videoRefs.before === null) return;

    this.videoRefs.after.currentTime = this.videoRefs.before.currentTime;

    requestAnimationFrame(this.sync);
  }

  render({ beforeAndAfter }) {
    const { before, after } = beforeAndAfter;
    const { width, height } = before;
    const { clipX } = this.state;

    const clipBefore = `rect(0, ${clipX}px, ${height}px, 0)`;
    const clipAfter = `rect(0, ${width}px, ${height}px, ${clipX}px)`;

    // TODO: plays inline for mobile safari to work?

    return (
      <div className={styles.base}>
        <div className={styles.mediaWrapper} style={{ width: width + 'px', height: height + 'px' }}>
          <div className={styles.media} style={{ clip: clipBefore }}>
            {before.videoId && (
              <Video
                videoId={before.videoId}
                width={width}
                height={height}
                onRef={el => this.onRef('before', el)}
                defaultMuted={window.innerWidth < 660}
                muted={window.innerWidth < 660}
                playsInline
                sources={[{ src: 'http://mpegmedia.abc.net.au/news/video/201804/mooney.mp4', type: 'video/mp4' }]}
              />
            )}
            {!before.videoId && <img src={before.imageUrl} />}
          </div>
          <div className={styles.media} style={{ clip: clipAfter }}>
            {after.videoId && (
              <Video
                videoId={after.videoId}
                muted={true}
                width={width}
                height={height}
                onRef={el => this.onRef('after', el)}
                defaultMuted={true}
                playsInline
                sources={[{ src: 'http://mpegmedia.abc.net.au/news/video/201804/turnbull.mp4', type: 'video/mp4' }]}
              />
            )}
            {!after.videoId && <img src={after.imageUrl} />}
          </div>

          <div className={styles.divider} style={{ left: clipX + 'px', height: height + 'px' }} />
        </div>
        <div className={styles.captions} ref={el => (this.captions = el)} />
      </div>
    );
  }
}

module.exports = App;
