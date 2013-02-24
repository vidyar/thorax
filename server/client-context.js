var _ = require('underscore'),
    fs = require('fs'),
    jQuery = require('./fruit-loops'),
    location = require('./dom/location'),
    path = require('path'),
    printf = require('printf'),
    sourceMap = require('./source-map'),
    vm = require('vm');

const CONTEXT = 4;

module.exports = exports = function(index) {
  function exec(exec) {
    try {
      exec();
    } catch (err) {
      processError(err);
      throw err;
    }
  }

  var window = vm.createContext({
    $server: true,
    nextTick: function(callback) {
      process.nextTick(function() { exec(callback); });
    },

    getComputedStyle: function() {},
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
    },

    console: {
      log: function() {
        var args = _.map(arguments, function(arg) {
          if (arg && arg.split) {
            arg = stackContext(arg.split(/\n/g));
          }
          return arg;
        });
        console.log.apply(console, args);
      },
      error: function() {
        window.console.log.apply(this, arguments);
      }
    },
    document: {
      get body() {
        return $.$('body')[0];
      },

      querySelector: function(selector) {
        return $.$(selector)[0];
      },
      createElement: function(tagName) {
        return $.$('<' + tagName + '>');
      }
    }
  });
  window.self = window.window = window;
  window.document.defaultView = window;

  location(window, 'http://localhost:8080/home/register/1234');

  var $ = jQuery(window, fs.readFileSync(index), exec);
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

function mapReference(pathRef) {
  try {
    var match = /^\s+at (?:(.*?) \((.*?)\)|(.*?))$/m.exec(pathRef),
        location = match && (match[2] || match[3]),
        components = location.split(/:/g);

    var map = sourceMap.map(components[0], parseInt(components[1], 10), parseInt(components[2], 10));
    map.name = match[1];
    return map;
  } catch (err) {
    /* NOP */
  }
}
function processError(err) {
  if (err.clientProcessed) {
    return;
  }

  err.clientProcessed = true;

  var stack = err.stack,
      map = mapReference(stack),
      fileLines = '';

  if (map) {
    try {
      fileLines = fileContext(map.source, map.line) + '\n';
    } catch (err) {
      /* NOP */
    }

    stack = stack.split(/\n/);
    var msg = stack.shift() + '\n' + fileLines;

    err.message = msg;
    err.stack = msg + stackContext(stack);
  }
}

function fileContext(file, line) {
  // Input is 1 indexed, the array is 0 indexed.
  line--;

  var content = fs.readFileSync(file),
      lines = content.toString().split(/\n/g),

      start = Math.max(0, line - CONTEXT),
      end = Math.min(line + CONTEXT, lines.length),

      msg = '';

  for (var i = start; i < end; i++) {
    msg += printf('\t% 6d:%s %s\n', i+1, i === line ? '>' : ' ', lines[i]);
  }
  return msg;
}
function stackContext(stack) {
  var msg = '',
      seenClient = true;
  for (var i = 0; i < stack.length; i++) {
    var frame = stack[i];
    if (frame.indexOf('client-context.js') >= 0) {
      // Don't include anything more than the code we called
      if (seenClient) {
        msg += '  at (native)\n';
        seenClient = false;
      }
    } else {
      seenClient = true;

      var lookup = mapReference(frame);
      if (lookup) {
        msg += '  at' + (lookup.name ? ' ' + lookup.name : '') + ' (' + lookup.source + (lookup.line ? ':' + lookup.line : '') + (lookup.column ? ':' + lookup.column : '') + ')\n';
      } else {
        msg += frame + '\n';
      }
    }
  }
  return msg;
}
