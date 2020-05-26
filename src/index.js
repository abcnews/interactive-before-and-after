const domready = require('domready');
  const { h, render } = require('preact');
const { getBeforeAndAfters } = require('./util');

const PROJECT_NAME = 'interactive-before-and-after';

function init() {
  getBeforeAndAfters('VideoEmbed u-pull').then(beforeAndAfters => {
    beforeAndAfters.forEach(beforeAndAfter => {
      const App = require('./components/App');
      render(<App beforeAndAfter={beforeAndAfter} />, beforeAndAfter.mountNode, beforeAndAfter.mountNode.lastChild);
    });
  });
}

// Check to see if Odyssey is present on the page
function isOdysseyPresent() {
  return (
    [].slice.call(document.querySelectorAll('div[class="init-interactive"]')).filter(s => {
      return s.getAttribute('data-scripts').indexOf('/odyssey/') > -1;
    }).length > 0
  );
}

if (isOdysseyPresent()) {
  if (window.__ODYSSEY__) {
    init();
  } else {
    window.addEventListener('odyssey:api', init);
  }
} else {
  domready(init);
}

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
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
