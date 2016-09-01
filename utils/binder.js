'user strict'
var logger = require('./logger.js');

var Binder = function(cfgJson){
	logger.trace(cfgJson);
  this.cfg = require(cfgJson);
	this.checkConfig();
};

Binder.prototype.checkConfig = function () {
	var self = this;
	logger.trace("CHECK BINDER CONFIG DATA.");
};

Binder.prototype.getSelfInput = function (schema) {
	var self = this;
	return self.cfg.input[schema]
};

var binder = new Binder('../config/bind.json');
module.exports = binder;
