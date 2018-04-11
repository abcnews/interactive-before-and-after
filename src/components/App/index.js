const { h, Component } = require('preact');
const styles = require('./styles.scss');

class App extends Component {
  constructor(props) {
    super(props);

    this.onMouseMove = this.onMouseMove.bind(this);

    this.state = {
      clipX: 0
    };
  }

  componentDidMount() {
    const { before, beforeCaption, after, afterCaption } = this.props.beforeAndAfter;

    this.before.appendChild(before.node);
    this.after.appendChild(after.node);

    this.captions.appendChild(beforeCaption);
    this.captions.appendChild(afterCaption);

    this.base.addEventListener('mousemove', this.onMouseMove);
  }

  componentWillUnmount() {
    const { before, after } = this.props.beforeAndAfter;

    this.before.removeChild(before.node);
    this.after.removeChild(after.node);

    this.captions.removeChild(beforeCaption);
    this.captions.removeChild(afterCaption);

    this.base.removeEventListener('mousemove', this.onMouseMove);
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

  render({ beforeAndAfter }) {
    const { before, after } = beforeAndAfter;
    const { width, height } = before;
    const { clipX } = this.state;

    const clipBefore = `rect(0, ${clipX}px, ${height}px, 0)`;
    const clipAfter = `rect(0, ${width}px, ${height}px, ${clipX}px)`;

    return (
      <div className={styles.base}>
        <div className={styles.mediaWrapper} style={{ width: width + 'px', height: height + 'px' }}>
          <div
            className={`${styles.media} ${styles.before}`}
            ref={el => (this.before = el)}
            style={{ clip: clipBefore }}
          />
          <div
            className={`${styles.media} ${styles.after}`}
            ref={el => (this.after = el)}
            style={{ clip: clipAfter }}
          />
        </div>
        <div className={styles.captions} ref={el => (this.captions = el)} />
      </div>
    );
  }
}

module.exports = App;
