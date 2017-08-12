'use strict';
var logger = require('../utils/logger.js');

var dataHandler = function () {
}

dataHandler.prototype.dataProcess = function(from, data, callback){
	logger.trace('handler dataProcess data from [' + from + 
                ']: ' + JSON.stringify(data));
	if (typeof callback === 'function') {
		callback(null, JSON.stringify(data));
	}
};

var handler = new dataHandler();
module.exports = handler;
