const { h, Component } = require('preact');
const styles = require('./styles.scss');
const Video = require('../Video');

const arrowsImage = require('./arrows.png');
const arrowUpImage = require('./arrow-up.png');
const arrowDownImage = require('./arrow-down.png');
const arrowLeftImage = require('./arrow-left.png');
const arrowRightImage = require('./arrow-right.png');

class App extends Component {
  constructor(props) {
    super(props);

    this.onPointerMove = this.onPointerMove.bind(this);

    this.toggleAfter = this.toggleAfter.bind(this);

    this.onRef = this.onRef.bind(this);
    this.onSourceLoad = this.onSourceLoad.bind(this);
    this.onVideoReady = this.onVideoReady.bind(this);
    this.onVideoPlay = this.onVideoPlay.bind(this);
    this.sync = this.sync.bind(this);

    this.onResize = this.onResize.bind(this);

    this.state = {
      showArrows: true,
      showFadeHint: props.beforeAndAfter.config.mode === 'fade',
      mouseX: null,
      mouseY: null,
      sourceWidth: null,
      sourceHeight: null,
      isAfterVisible: props.beforeAndAfter.config.mode !== 'fade'
    };

    this.videosLoaded = 0;
    this.videoRefs = {};
  }

  componentDidMount() {
    const { before, after } = this.props.beforeAndAfter;

    if (before.captionNode) this.captions.appendChild(before.captionNode);
    if (after.captionNode) this.captions.appendChild(after.captionNode);

    window.addEventListener('resize', this.onResize);
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

    window.removeEventListener('resize', this.onResize);
  }

  onResize() {
    this.forceUpdate();
  }

  toggleAfter() {
    if (this.props.beforeAndAfter.config.mode !== 'fade') return;

    this.setState(state => {
      return {
        isAfterVisible: !state.isAfterVisible,
        showFadeHint: false
      };
    });
  }

  onPointerMove(event) {
    event.stopPropagation();
    event.preventDefault();

    const { top, left } = this.base.getBoundingClientRect();
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;

    this.setState(() => {
      return {
        showArrows: false,
        mouseX: clientX - left,
        mouseY: clientY - top
      };
    });

    clearTimeout(this.arrowTimeout);
    this.arrowTimeout = setTimeout(() => {
      this.setState(() => {
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
      this.setState(() => ({
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
  }

  render({ beforeAndAfter }) {
    const { before, after, config } = beforeAndAfter;
    let { width, height } = before;
    let { mouseX, mouseY, sourceWidth, sourceHeight } = this.state;

    if (typeof height === 'undefined' && sourceHeight) {
      height = (width / sourceWidth) * sourceHeight;
    }

    if (window.innerWidth < 980) {
      const ratio = height / width;
      width = window.innerWidth;
      height = width * ratio;
    } else {
      width = 952;
      height = 535.5;
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
      case 'fade':
        clipBefore = `rect(0, ${width}px, ${height}px, 0)`; // always show all
        clipAfter = `rect(0, ${width}px, ${height}px, 0)`; // always show all
        break;
      case 'slide':
      default:
        clipBefore = `rect(0, ${mouseX}px, ${height}px, 0)`;
        clipAfter = `rect(0, ${width}px, ${height}px, ${mouseX}px)`;
    }

    let hint;
    let hint2;
    if (height) {
      if (config.mode === 'slide') {
        hint = (
          <img
            src={arrowsImage}
            className={[styles.arrows, this.state.showArrows ? styles.arrowsVisible : null].join(' ')}
            style={{
              width: '100px',
              height: '30px',
              top: (height - 30) / 2 + 'px',
              left: mouseX - 50 + 'px',
              zIndex: 10
            }}
          />
        );
        hint2 = (
          <div
            className={styles.hintText}
            style={{
              opacity: this.state.showArrows ? 1 : 0,
              left: mouseX > width / 2 ? '0px' : 'initial',
              right: mouseX <= width / 2 ? '0px' : 'initial',
              transform: 'translate(0,0)'
            }}>
            {window.innerWidth < 500 ? 'Tap and drag' : 'Hover and slide'}
          </div>
        );
      } else if (config.mode === 'peek') {
        hint = (
          <div className={[styles.invisible, this.state.showArrows ? styles.arrowsVisible : null].join(' ')}>
            <img
              src={arrowUpImage}
              className={styles.arrowUp}
              style={{ top: `${mouseY - peekSize * 1.3 - 30}px`, left: `${mouseX - 15}px` }}
            />
            <img
              src={arrowDownImage}
              className={styles.arrowDown}
              style={{ top: `${mouseY + peekSize * 1.3}px`, left: `${mouseX - 15}px` }}
            />
            <img
              src={arrowLeftImage}
              className={styles.arrowLeft}
              style={{ top: `${mouseY - 15}px`, left: `${mouseX - peekSize * 1.3 - 30}px` }}
            />
            <img
              src={arrowRightImage}
              className={styles.arrowRight}
              style={{ top: `${mouseY - 15}px`, left: `${mouseX + peekSize * 1.3}px` }}
            />
          </div>
        );
      } else if (config.mode === 'fade') {
        hint = (
          <div
            className={[styles.fadeHint, this.state.showFadeHint ? styles.visible : null].join(' ')}
            style={{
              width: width + 'px',
              top: height / 2 - 8 + 'px'
            }}>
            {window.innerWidth < 660 ? 'Tap' : 'Click'} to switch before/after
          </div>
        );
      }
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
                sources={before.sources}
                onRef={el => this.onRef('before', el)}
                onLoad={this.onSourceLoad}
              />
            )}
            {!before.videoId && <img src={before.imageUrl} width={width} height={height} />}
          </div>
          <div
            className={styles.media}
            style={{ clip: clipAfter, zIndex: 2, opacity: this.state.isAfterVisible ? 1 : 0 }}
            onClick={this.toggleAfter}>
            {after.videoId && (
              <Video
                videoId={after.videoId}
                width={width}
                height={height}
                sources={after.sources}
                onRef={el => this.onRef('after', el)}
              />
            )}
            {!after.videoId && <img src={after.imageUrl} width={width} height={height} />}
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

        {hint}
        {hint2}
      </div>
    );
  }
}

module.exports = App;
