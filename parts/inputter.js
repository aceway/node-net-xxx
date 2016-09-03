'use strict';
var logger = require('../utils/logger.js');
var core = require('../processor/core.js');

var Inputter = function(schema, host, port) {
	this.schema = schema;
	this.host = host;
	this.port = port;
	this.httpInputter = undefined;
	this.httpsInputter = undefined;
	this.wsInputter = undefined;
	this.tcpInputter = undefined;
};

Inputter.prototype.start = function (callback) {
	var self = this;
	logger.trace("Inputter listen on " + self.schema  + "://" + 
							self.host + ":" + self.port);
	switch(self.schema){
	case 'http':
		if ( self.httpInputter === undefined ){
			var HttpInputter = require('./inputter/HttpInputter.js');
			self.httpInputter = new HttpInputter(self.host, self.port);
		}

		if ( self.httpInputter !== undefined ){
			self.httpInputter.regDataProcess( core.dataProcess );
			callback(null, self.host +":"+ self.port 
								+ " schema:" + self.schema);
		}
		else {
			callback(1, self.host +":"+ self.port 
								+ " schema:" + self.schema + " failed." );
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
