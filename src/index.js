const { h, render } = require('preact');
const { loadBeforeAndAfters } = require('./util');

const PROJECT_NAME = 'interactive-before-and-after';

const beforeAndAfters = loadBeforeAndAfters();

function init() {
  beforeAndAfters.forEach(beforeAndAfter => {
    console.log({ beforeAndAfter });

    const App = require('./components/App');
    render(<App beforeAndAfter={beforeAndAfter} />, beforeAndAfter.mountNode, beforeAndAfter.mountNode.lastChild);
  });
}

init();

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      init();
    } catch (err) {
      const ErrorBox = require('./components/ErrorBox');
      render(<ErrorBox error={err} />, beforeAndAfters[0].mountNode, beforeAndAfters[0].mountNode.lastChild);
    }
  });
}

if (process.env.NODE_ENV === 'development') {
  require('preact/devtools');
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
