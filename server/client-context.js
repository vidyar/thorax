var clientConsole = require('./dom/console'),
    document = require('./dom/document'),
    exec = require('./client-exec').exec,
    fs = require('fs'),
    jQuery = require('./fruit-loops'),
    location = require('./dom/location'),
    path = require('path'),
    vm = require('vm');

module.exports = exports = function(index) {
  var window = vm.createContext({
    $server: true,
    nextTick: function(callback) {
      process.nextTick(function() { exec(callback); });
    },

    navigator: {
      userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7'
    },

    sessionStorage: {
      getItem: function() {
      }
    },
    localStorage: {
      getItem: function() {
      }
    },

    loadInContext: function(href, callback) {
      if (href && window.lumbarLoadPrefix) {
        href = path.relative(window.lumbarLoadPrefix, href);
        href = path.resolve(path.dirname(index) + '/web', href);
      }

      exec(function() {
        vm.runInContext(fs.readFileSync(href), window, href);
      });

      if (callback) {
        window.nextTick(callback);
      }
    }
  });
  window.self = window.window = window;

  document(window);
  clientConsole(window);
  location(window, 'http://localhost:8080/home/register/1234');

  var $ = jQuery(window, fs.readFileSync(index));
  window.jQuery = window.Zepto = window.$ = $.$;

  var files = $.$('script');
  files.each(function() {
    var el = $.$(this),
        text = el.text(),
        external = el.attr('src');

    if (external) {
      window.loadInContext(external);
    } else {
      exec(function() {
        vm.runInContext(text, window, text);
      });
    }
  }, this);
};
