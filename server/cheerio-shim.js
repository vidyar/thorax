var Cheerio = require('cheerio');

var $make = Cheerio.prototype.make;

Cheerio.prototype.make = function(dom, context) {
  var ret = $make.call(this, dom, context);

  ret.__defineSetter__('innerHTML', function(html) {
    this.html(html || '');
  });

  return ret;
};

Cheerio.prototype.bind = Cheerio.prototype.unbind =
Cheerio.prototype.on = Cheerio.prototype.off =
Cheerio.prototype.delegate = function() {
  return this;
};

Cheerio.prototype.get = Cheerio.prototype.eq;
Cheerio.prototype.forEach = function(callback, scope) {
  var elements = this;
  elements.each(function(index) {
    callback.call(scope || elements, this, index);
  });
};

Cheerio.prototype.getAttribute = function(name) {
  return this.attr(name);
};

Cheerio.prototype.toggleClass = function(className, toggle) {
  if (toggle === undefined) {
    toggle = !this.hasClass(className);
  }
  if (toggle) {
    this.addClass(className);
  } else {
    this.removeClass(className);
  }
  return this;
};

Cheerio.prototype.focus = function() {
  return this;
};


Cheerio.prototype.ready = function(callback) {
  callback();
};
