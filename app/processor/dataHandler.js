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
	let data = null;
	if (typeof dataInfo === 'object' && dataInfo && dataInfo.data){
		if (typeof dataInfo.data === 'object' && dataInfo.data){
			data = dataInfo.data;
			if (Object.keys(data).length === 0 ){
				data = null;
			}
		}
		else if (typeof dataInfo.data === 'string'){
			try{
				data = JSON.parse(dataInfo.data);
				if (Object.keys(data).length === 0 ){
					data = null;
				}
			}
			catch(e){
				data = dataInfo;
			}
		}
		else{
			data = null;
		}
	}	
	else if(typeof dataInfo === 'string'){
		try{
			data = JSON.parse(dataInfo);
			if (Object.keys(data).length === 0 ){
				data = null;
			}
		}
		catch(e){
			data = dataInfo;
		}
	}
	else{
			data = null;
	}

	if (typeof callback === 'function'  && data) {
    partMgr.sendData2AllOutputter(data);
		callback(null, data);
	}
};

module.exports = new dataHandler();
