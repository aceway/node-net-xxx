'use strict';
const logger = require('../utils/logger.js');

class dataHandler {
  constructor () {
  }
}

dataHandler.prototype.dataProcess = function(dataInfo, callback){
	logger.trace('handler dataProcess data info' + 
                ']: ' + JSON.stringify(dataInfo));
	if (typeof callback === 'function') {
		callback(null, JSON.stringify(dataInfo));
	}
};

let handler = new dataHandler();
module.exports = handler;
