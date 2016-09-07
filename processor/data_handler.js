'use strict';
var logger = require('../utils/logger.js');

var dataHandler = function () {
}

dataHandler.prototype.dataProcess = function(data, callback){
	logger.trace('handler dataProcess data...');
	if (typeof callback === 'function') {
		callback(null, data);
	}
};

var handler = new dataHandler();
module.exports = handler;
