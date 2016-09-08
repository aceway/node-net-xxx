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

// outputter self's inputter config.
Binder.prototype.getSelfInputter = function (schema) {
	var self = this;
	return self.cfg.inputter[schema]
};

// Is a inputter would output to self connection ?
Binder.prototype.isOutputterSelf = function(schema) {
	var self = this;
	for(var idx in self.cfg.outputter_listen[schema]){
		if ("self" === self.cfg.outputter_listen[schema][idx]) {
			return true;
		}
	}
	return false;
}

var binder = new Binder('../config/bind.json');
module.exports = binder;
