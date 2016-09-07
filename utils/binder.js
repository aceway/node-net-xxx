'user strict'
var logger = require('./logger.js');

var Binder = function(cfgJson){
	logger.trace(cfgJson);
  this.cfg = require(cfgJson);
};

Binder.prototype.prepareCfg = function (callback) {
	var self = this;
	logger.trace("CHECK BINDER CONFIG DATA.");
	callback(null, "Binder config ok");
};

Binder.prototype.getSelfInputter = function (schema) {
	var self = this;
	return self.cfg.inputter[schema]
};

var binder = new Binder('../config/bind.json');
module.exports = binder;
