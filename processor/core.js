'use strict';
var logger = require('../utils/logger.js');

var Core = function () {
};

Core.prototype.dataProcess = function(data){
	logger.trace('Core dataProcess data');
};

var core = new Core();
module.exports = core;
