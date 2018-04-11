const alternatingCaseToObject = require('@abcnews/alternating-case-to-object');

/**
 * Detect any #beforeandafter sections
 */
function loadBeforeAndAfters(className) {
  if (!window.beforeAndAfters) {
    window.beforeAndAfters = [].slice.call(document.querySelectorAll(`a[name^=beforeandafter]`)).map(element => {
      let node = element.nextElementSibling;
      let nodes = [];
      let hasMoreContent = true;
      while (hasMoreContent && node) {
        if (node.tagName && (node.getAttribute('name') || '').indexOf('endbeforeandafter') > -1) {
          hasMoreContent = false;
        } else {
          if (
            node.tagName === 'IMG' ||
            node.querySelector('img') ||
            node.tagName === 'VIDEO' ||
            node.querySelector('video')
          ) {
            const { width, height } = node.firstElementChild.getBoundingClientRect();
            nodes.push({
              node,
              height,
              width
            });
            if (nodes.length >= 2) {
              hasMoreContent = false;
            }
          }
          node = node.nextElementSibling;
        }
      }

      nodes.forEach(n => n.node.parentNode.removeChild(n.node));

      const mountNode = document.createElement('div');
      mountNode.className = className || '';
      element.parentNode.insertBefore(mountNode, element);

      return {
        config: alternatingCaseToObject(element.getAttribute('name').replace('beforeandafter', '')),
        before: nodes[0],
        beforeCaption: nodes[0].node.querySelector('.inline-caption'),
        after: nodes[1],
        afterCaption: nodes[1].node.querySelector('.inline-caption'),
        mountNode
      };
    });
  }

  return window.beforeAndAfters;
}

module.exports.loadBeforeAndAfters = loadBeforeAndAfters;
