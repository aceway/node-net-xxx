'use strict';
var logger = require('../utils/logger.js');
var dataHandler = require('../processor/data_handler.js');

var Inputter = function(schema, host, port, response) {
	this.schema = schema;
	this.host = host;
	this.port = port;
	this.httpInputter = undefined;
	this.httpsInputter = undefined;
	this.wsInputter = undefined;
	this.tcpInputter = undefined;
	this.response = !! response;
};

Inputter.prototype.start = function (callback) {
	var self = this;
	//logger.trace("Inputter listen on " + self.schema  + "://" + 
	//						self.host + ":" + self.port);
	switch(self.schema){
	case 'http':
		if ( self.httpInputter === undefined ){
			var HttpInputter = require('./inputter/HttpInputter.js');
			self.httpInputter = new HttpInputter(self.host, self.port, self.response);
		}

		if ( self.httpInputter === undefined ){
			callback(1, self.host +":"+ self.port 
								+ " schema:" + self.schema + " failed." );
			break;
		}
		else {
			self.httpInputter.regDataProcess( dataHandler.dataProcess );
			callback(null, self.host +":"+ self.port 
								+ " schema:" + self.schema);
			self.httpInputter.start();
		}
		break;
	case 'https':
		callback(1, self.host +":"+ self.port 
							+ " would implement schema:" + self.schema);
		break;
	case 'websocket':
		callback(1, self.host +":"+ self.port 
							+ " would implement schema:" + self.schema);
		break;
	case 'tcp':
		callback(1, self.host +":"+ self.port 
							+ " would implement schema:" + self.schema);
		break;
	default:
		callback(-1, self.host +":"+ self.port 
							+ " not surpported schema:" + self.schema);
		break;
	}
};

module.exports = Inputter;
