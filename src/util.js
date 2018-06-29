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

function getContent(node) {
  if (!node.isWaitingForContent) return Promise.resolve(node);

  return new Promise((resolve, reject) => {
    const _getContent = (node, done) => {
      let v = node.isWaitingForContent.querySelector('video');
      if (v) {
        let rect = v.getBoundingClientRect();
        node.sources = [
          {
            src: v.getAttribute('src'),
            type: 'video/mp4',
            width: rect.width,
            height: rect.height
          }
        ];
        node.videoId = true;
        node.width = rect.width;
        node.height = rect.height;
        node.captionNode = node.isWaitingForContent.querySelector('p[title]');
        done(node);
      } else {
        setTimeout(() => _getContent(node, done), 1000);
      }
    };

    _getContent(node, resolve);
  });
}

/**
 * Detect any #beforeandafter sections
 */
function getBeforeAndAfters(className) {
  if (window.__BEFORE_AND_AFTERS__) return Promise.resolve(window.__BEFORE_AND_AFTERS__);

  const anchors = [].slice.call(document.querySelectorAll(`a[name^=beforeandafter]`));

  if (anchors.length === 0) {
    window.__AUNTY_HELPER__("You're using the Before And After plugin but haven't added any #beforeandafter tags yet.");
    Promise.reject(new Error('Before and After could not be loaded'));
  }

  return Promise.all(
    anchors.map(element => {
      let node = element.nextElementSibling;
      let nodes = [];
      let hasMoreContent = true;
      while (hasMoreContent && node) {
        if (node.tagName && (node.getAttribute('name') || '').indexOf('endbeforeandafter') > -1) {
          hasMoreContent = false;
        } else {
          let isWaitingForContent = false;
          let width;
          let height;
          let videoId;
          let imageUrl;
          let sources;
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
          } else if (node.className.indexOf('VideoEmbed') > -1) {
            isWaitingForContent = node;
          }

          if (videoId || imageUrl || isWaitingForContent) {
            nodes.push({
              isWaitingForContent,
              videoId,
              imageUrl,
              sources,
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
          if (!isWaitingForContent) {
            previousNode.parentNode.removeChild(previousNode);
          }
        }
      }

      return resolveNodesToContent(nodes, element, className);
    })
  ).then(anchors => {
    window.__BEFORE_AND_AFTERS__ = anchors;
    return window.__BEFORE_AND_AFTERS__;
  });
}

function resolveNodesToContent(nodes, element, className) {
  return Promise.all(nodes.map(getContent)).then(nodes => {
    if (nodes.length < 2) {
      window.__AUNTY_HELPER__('You need to have at least two media elements between your #beforeandafter tags.');
    }

    nodes.forEach(node => {
      if (node.isWaitingForContent) {
        node.isWaitingForContent.parentNode.removeChild(node.isWaitingForContent);
      }
    });

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

module.exports.getBeforeAndAfters = getBeforeAndAfters;
