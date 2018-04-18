const { h, Component } = require('preact');
const styles = require('./styles.scss');
const Video = require('../Video');

const arrowsImage = require('./arrows.png');

class App extends Component {
  constructor(props) {
    super(props);

    this.onPointerMove = this.onPointerMove.bind(this);

    this.onRef = this.onRef.bind(this);
    this.onSourceLoad = this.onSourceLoad.bind(this);
    this.onVideoReady = this.onVideoReady.bind(this);
    this.onVideoPlay = this.onVideoPlay.bind(this);
    this.sync = this.sync.bind(this);

    this.state = {
      showArrows: true,
      mouseX: null,
      mouseY: null,
      sourceWidth: null,
      sourceHeight: null
    };

    this.videosLoaded = 0;
    this.videoRefs = {};
  }

  componentDidMount() {
    const { before, beforeCaption, after, afterCaption } = this.props.beforeAndAfter;

    this.captions.appendChild(before.captionNode);
    this.captions.appendChild(after.captionNode);
  }

  componentWillUnmount() {
    const { before, after } = this.props.beforeAndAfter;

    this.captions.removeChild(before.captionNode);
    this.captions.removeChild(after.captionNode);

    this.videoRefs.before.removeEventListener('canplaythrough', this.onVideoReady);
    this.videoRefs.before.removeEventListener('play', this.onVideoPlay);
    this.videoRefs.before = null;
    this.videoRefs.after.removeEventListener('canplaythrough', this.onVideoReady);
    this.videoRefs.after = null;

    clearTimeout(this.arrowTimeout);
    this.arrowTimeout = null;
  }

  onPointerMove(event) {
    const { top, left } = this.base.getBoundingClientRect();
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;

    this.setState(state => {
      return {
        showArrows: false,
        mouseX: clientX - left,
        mouseY: clientY - top
      };
    });

    clearTimeout(this.arrowTimeout);
    this.arrowTimeout = setTimeout(() => {
      this.setState(state => {
        return {
          showArrows: true
        };
      });
    }, 2000);
  }

  onRef(which, element) {
    if (!element) return;

    element.addEventListener('canplaythrough', this.onVideoReady);
    this.videoRefs[which] = element;
  }

  onSourceLoad(sources) {
    if (!this.state.sourceHeight && sources.length > 0) {
      this.setState(state => ({
        sourceWidth: sources[0].width,
        sourceHeight: sources[0].height
      }));
    }
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

    const { before, after } = this.videoRefs;
    if (Math.floor(after.currentTime) !== Math.floor(before.currentTime)) {
      after.currentTime = before.currentTime;
    }

    requestAnimationFrame(this.sync);
  }

  render({ beforeAndAfter }) {
    const { before, after, config } = beforeAndAfter;
    let { width, height } = before;
    let { mouseX, mouseY, sourceWidth, sourceHeight } = this.state;

    if (typeof height === 'undefined' && sourceHeight) {
      height = width / sourceWidth * sourceHeight;
    }

    if (mouseX === null) mouseX = config.start * width * 0.01;
    if (mouseY === null) mouseY = config.start * height * 0.01;

    const peekSize = width * 0.01 * config.size * 0.5;

    let clipBefore;
    let clipAfter;
    switch (config.mode) {
      case 'peek':
        clipBefore = `rect(0, ${width}px, ${height}px, 0)`; // always show all of the behind one
        clipAfter = `rect(${mouseY - peekSize}px, ${mouseX + peekSize}px, ${mouseY + peekSize}px, ${mouseX -
          peekSize}px)`;
        break;
      case 'slide':
      default:
        clipBefore = `rect(0, ${mouseX}px, ${height}px, 0)`;
        clipAfter = `rect(0, ${width}px, ${height}px, ${mouseX}px)`;
    }

    return (
      <div className={styles.base} onMouseMove={this.onPointerMove} onTouchMove={this.onPointerMove}>
        <div className={styles.mediaWrapper} style={{ width: width + 'px', height: height + 'px' }}>
          <div className={styles.media} style={{ clip: clipBefore, zIndex: 1 }}>
            {before.videoId && (
              <Video
                videoId={before.videoId}
                width={width}
                height={height}
                onRef={el => this.onRef('before', el)}
                onLoad={this.onSourceLoad}
              />
            )}
            {!before.videoId && <img src={before.imageUrl} />}
          </div>
          <div className={styles.media} style={{ clip: clipAfter, zIndex: 2 }}>
            {after.videoId && (
              <Video
                videoId={after.videoId}
                muted={true}
                width={width}
                height={height}
                onRef={el => this.onRef('after', el)}
              />
            )}
            {!after.videoId && <img src={after.imageUrl} />}
          </div>

          {config.mode === 'slide' && (
            <div className={styles.divider} style={{ left: mouseX + 'px', height: height + 'px' }} />
          )}

          {config.mode === 'peek' && (
            <div
              className={styles.peekBorder}
              style={{
                left: mouseX - peekSize,
                top: mouseY - peekSize,
                width: peekSize * 2 + 'px',
                height: peekSize * 2 + 'px'
              }}
            />
          )}
        </div>
        <div className={styles.captions} ref={el => (this.captions = el)} />

        {config.mode === 'slide' &&
          height && (
            <img
              src={arrowsImage}
              className={[styles.arrows, this.state.showArrows ? styles.arrowsVisible : null].join(' ')}
              style={{
                width: '100px',
                height: '30px',
                top: (height - 30) / 2 + 'px',
                left: mouseX - 50 + 'px'
              }}
            />
          )}
      </div>
    );
  }
}

module.exports = App;
