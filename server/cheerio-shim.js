var Cheerio = require('cheerio');

Cheerio.prototype.bind = Cheerio.prototype.unbind =
Cheerio.prototype.on = Cheerio.prototype.off =
Cheerio.prototype.delegate = function() {
  return this;
};

Cheerio.prototype.forEach = Cheerio.prototype.each;
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

Cheerio.prototype.ready = function(callback) {
  callback();
};
