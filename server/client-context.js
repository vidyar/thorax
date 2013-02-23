var _ = require('underscore'),
    fs = require('fs'),
    jQuery = require('./$'),
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
  var $ = jQuery(fs.readFileSync(index), exec);

  var window = {
    $: $,

    $server: true,
    nextTick: function(callback) {
      process.nextTick(function() { exec(callback); });
    },

    getComputedStyle: function() {},
    navigator: {
      userAgent: 'TODO : Whatever the user sent'
    },

    sessionStorage: {
      getItem: function() {
      }
    },
    localStorage: {
      getItem: function() {
      }
    },
    location: {
      // TODO : Implement
      href: 'http://localhost:8080/#home',
      pathname: '/'
    },

    loadInContext: function(href, callback) {
      if (href && context.lumbarLoadPrefix) {
        href = path.relative(context.lumbarLoadPrefix, href);
        href = path.resolve(path.dirname(index) + '/web', href);
      }

      exec(function() {
        vm.runInContext(fs.readFileSync(href), context, href);
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
        return $('body')[0];
      },

      querySelector: function(selector) {
        return $(selector)[0];
      },
      createElement: function(tagName) {
        return $('<' + tagName + '>');
      }
    }
  };
  window.jQuery = window.Zepto = window.$;
  window.self = window.window = window;
  window.document.defaultView = window;

  var context = this.context = vm.createContext(window);

  var files = $('script');
  files.each(function() {
    var text = $(this).text(),
        external = $(this).attr('src');

    if (external) {
      window.loadInContext(external);
    } else {
      exec(function() {
        vm.runInContext(text, context, text);
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
      map = mapReference(stack);

  if (map) {
    try {
      var fileLines = fileContext(map.source, map.line);

      stack = stack.split(/\n/);
      var msg = stack.shift() + '\n' + fileLines + '\n';

      err.message = msg;
      err.stack = msg + stackContext(stack);
    } catch (err) {
      /* NOP */
    }
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
      seenClient;
  for (var i = 0; i < stack.length; i++) {
    var frame = stack[i];
    if (frame.indexOf('client-context.js') >= 0) {
      // Don't include anything more than the code we called
      if (seenClient) {
        msg += '  at <native>\n';
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
