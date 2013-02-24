var ajax = require('./fruit-loops/ajax'),
    Cheerio = require('cheerio');

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

  // TODO : Proper user agent parsing
  $.os = {};


  $.fn = Cheerio.prototype;

  return {
    $: $,
    root: root,
    ajax: ajax($, exec)
  };
};
