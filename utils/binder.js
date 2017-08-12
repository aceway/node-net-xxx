'use strict';
const logger = require('./logger.js');

let Binder = function(cfgJson){
  this.cfg = require(cfgJson);
};

Binder.prototype.prepareCfg = function (callback) {
	let self = this;
	logger.trace("TODO: CHECK BINDER CONFIG DATA.");
	callback(null, "Bind config ok");
};

// outputter self's inputter config.
// every schema has only one inputter
Binder.prototype.getSelfInputter = function (schema) {
	let self = this;
	return self.cfg.inputter[schema];
};


module.exports = Binder;
