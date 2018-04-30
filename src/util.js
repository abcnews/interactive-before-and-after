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
    const anchors = [].slice.call(document.querySelectorAll(`a[name^=beforeandafter]`));

    if (anchors.length === 0) {
      window.__AUNTY_HELPER__(
        "You're using the Before And After plugin but haven't added any #beforeandafter tags yet."
      );
    }

    window.beforeAndAfters = anchors.map(element => {
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
            captionNode = document.createElement('div');
            captionNode.innerHTML = node.querySelector('article').innerHTML;

            // Remove the time
            const timeNode = captionNode.querySelector('time');
            if (timeNode) {
              timeNode.parentNode.removeChild(timeNode);
            }
            // Remove the icon
            captionNode.className = captionNode.className.replace('image-none', '');

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

      if (nodes.length < 2) {
        window.__AUNTY_HELPER__('You need to have at least two media elements between your #beforeandafter tags.');
      }

      const mountNode = document.createElement('div');
      mountNode.className = className || '';
      element.parentNode.insertBefore(mountNode, element);

      let config = alternatingCaseToObject(element.getAttribute('name').replace('beforeandafter', ''));
      config.mode = config.mode || 'slide';
      config.start = config.start || 50;
      config.size = config.size || 20;

      return {
        before: nodes[0],
        after: nodes[1],
        config,
        mountNode
      };
    });
  }

  return window.beforeAndAfters;
}

module.exports.getBeforeAndAfters = getBeforeAndAfters;
