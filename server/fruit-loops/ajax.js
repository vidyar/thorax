var Events = require('events'),
    request = require('request');

module.exports = function($, exec) {
  var ajax = new Events.EventEmitter();
  ajax.log = {};
  $.ajax = function(options) {
    console.log(options.url);
    ajax.log[options.url] = null;
    request({
        method: options.type || 'GET',
        url: options.url,
        form: options.data
      },
      function(err, response, body) {
        // TODO : Handle any cookie info that might be necessary
        exec(function() {
          try {
            if (!err && response.statusCode === 200) {
              try {
                body = JSON.parse(body);
              } catch (err) {
                body = undefined;
                return options.error({}, 'parseerror', err);
              }

              options.success(body, 'success', {});
            } else {
              console.log(err, response, body);
              options.error({}, 'error', err);
            }
          } finally {
            options.complete();

            ajax.log[options.url] = body || false;
            ajax.emit('complete');
          }
        });
      });
  };

  return ajax;
};
