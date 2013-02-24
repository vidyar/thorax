var ajax = require('./fruit-loops/ajax'),
    Cheerio = require('cheerio');
    detect = require('./fruit-loops/detect');

require('./cheerio-shim');

// TODO : For testing run the zepto tests (that apply) against the output
module.exports = exports = function(html, exec) {
  var root = Cheerio.load(html);

  function $(selector, context) {
    // Special case the document instance
    if (selector && selector.createElement) {
      selector = root;
    }
    if (context && context.createElement) {
      context = root;
    }

    return root(selector, context);
  }

  detect($, 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7');

  $.fn = Cheerio.prototype;

  return {
    $: $,
    root: root,
    ajax: ajax($, exec)
  };
};
