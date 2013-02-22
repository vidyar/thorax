var fs = require('fs'),
    printf = require('printf'),
    sourceMap = require('./source-map'),
    vm = require('vm');

const CONTEXT = 4;

module.exports = exports = function(files) {
  this.context = vm.createContext({
    console: console,
    window: {},
    document: {},
    $: function() {
      return {
        ready: function() {
        }
      };
    }
  });

  files.forEach(function(content) {
    var file = content.src || 'static';
    content = content.src ? fs.readFileSync(content.src) : content;

    try {
      vm.runInContext(content, this.context, file);
    } catch (err) {
      processError(err);
      throw err;
    }
  }, this);
};

function mapReference(pathRef) {
  try {
    var match = /^\s+at (?:.*? \((.*?)\)|(.*?))$/m.exec(pathRef),
        location = match && (match[1] || match[2]),
        components = location.split(/:/g);

    return sourceMap.map(components[0], parseInt(components[1], 10), parseInt(components[2], 10));
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

      frame = mapReference(frame);
      msg += '  at ' + frame.source + ':' + frame.line + ':' + frame.column + '\n';
    }
  }
  return msg;
}
