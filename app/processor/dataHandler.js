'use strict';
const logger = require('../utils/logger.js');
const partMgr = require('../parts/partManager.js');

class dataHandler {
  constructor () {
  }
}

dataHandler.prototype.dataProcess = function(dataInfo, callback){
	logger.trace('handler dataProcess data info' + 
                ': ' + JSON.stringify(dataInfo));
	if (typeof callback === 'function') {
    partMgr.sendData2AllOutputter(dataInfo);
		callback(null, JSON.stringify(dataInfo));
	}
};

module.exports = new dataHandler();
