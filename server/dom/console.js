var _ = require('underscore'),
    rewriteStack = require('../client-exec').rewriteStack;

module.exports = function(window) {
  window.console = {
    log: function() {
      console.log.apply(console, mapArgs(arguments));
    },
    error: function() {
      console.error.apply(console, mapArgs(arguments));
    }
  };
};

function mapArgs(args) {
  return _.map(arguments, function(arg) {
    if (arg && arg.split) {
      arg = rewriteStack(arg);
    }
    return arg;
  });
}
