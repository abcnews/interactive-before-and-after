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
function getBeforeAndAfters(className) {
  if (!window.beforeAndAfters) {
    window.beforeAndAfters = [].slice.call(document.querySelectorAll(`a[name^=beforeandafter]`)).map(element => {
      let node = element.nextElementSibling;
      let nodes = [];
      let hasMoreContent = true;
      while (hasMoreContent && node) {
        if (node.tagName && (node.getAttribute('name') || '').indexOf('endbeforeandafter') > -1) {
          hasMoreContent = false;
        } else {
          let width;
          let height;
          let videoId;
          let imageUrl;
          let captionNode;
          if (node.className.indexOf('photo full') > -1 || node.className.indexOf('video full') > -1) {
            videoId =
              node.className.indexOf('video') > -1 ? urlToCM(node.querySelector('a').getAttribute('href')) : null;
            imageUrl = node.querySelector('img').getAttribute('src');
            const rect = node.querySelector('a').getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            captionNode = node.querySelector('.inline-caption');
          } else if (node.className.indexOf('embed-content') > -1) {
            videoId = urlToCM(node.querySelector('a').getAttribute('href'));
            captionNode = node.querySelector('article');

            const article = document.querySelector('article');
            if (article) {
              width = article.offsetWidth - 20;
            }
          }

          if (videoId || imageUrl) {
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

module.exports.getBeforeAndAfters = getBeforeAndAfters;
