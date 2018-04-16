const alternatingCaseToObject = require('@abcnews/alternating-case-to-object');

function urlToCM(url) {
  try {
    // remove junk at the end and then just grab the last segment
    return url
      .split(/[\?\#]/)[0]
      .split('/')
      .slice(-1)[0];
  } catch (e) {
    return '';
  }
}

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
          if (node.className.indexOf('photo full') > -1 || node.className.indexOf('video full') > -1) {
            const videoId =
              node.className.indexOf('video') > -1 ? urlToCM(node.querySelector('a').getAttribute('href')) : null;
            const imageUrl = node.querySelector('img').getAttribute('src');
            const { width, height } = node.querySelector('a').getBoundingClientRect();
            const captionNode = node.querySelector('.inline-caption');

            nodes.push({
              videoId,
              imageUrl,
              height,
              width,
              captionNode
            });

            if (nodes.length >= 2) {
              hasMoreContent = false;
            }
          }

          const previousNode = node;
          node = node.nextElementSibling;
          previousNode.parentNode.removeChild(previousNode);
        }
      }

      const mountNode = document.createElement('div');
      mountNode.className = className || '';
      element.parentNode.insertBefore(mountNode, element);

      return {
        config: alternatingCaseToObject(element.getAttribute('name').replace('beforeandafter', '')),
        before: nodes[0],
        after: nodes[1],
        mountNode
      };
    });
  }

  return window.beforeAndAfters;
}

module.exports.loadBeforeAndAfters = loadBeforeAndAfters;
