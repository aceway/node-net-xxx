'use strict';
const logger = require('../utils/logger.js');
const partMgr = require('../parts/partManager.js');

class dataHandler {
  constructor () {
  }
}

dataHandler.prototype.dataProcess = function(dataInfo, callback){
  if (typeof dataInfo === 'string'){
	  logger.trace('handler dataProcess data info' + ': ' + dataInfo);
  }
  else{
	  logger.trace('handler dataProcess data info' + 
                ': ' + JSON.stringify(dataInfo));
  }

	if (typeof callback === 'function') {
    if (dataInfo && dataInfo.data){
      partMgr.sendData2AllOutputter(dataInfo.data);
		  callback(null, dataInfo.data);
    }
    else{
      partMgr.sendData2AllOutputter(dataInfo);
		  callback(null, dataInfo);
    }
	}
};

module.exports = new dataHandler();
