'use strict';
var logger = require('../utils/logger.js');

var Inputter = function(schema, host, port) {
	this.schema = schema;
	this.host = host;
	this.port = port;
};

Inputter.prototype.start = function (callback) {
	var self = this;
	logger.info("Input listen on " + self.schema  + "://" + 
							self.host + ":" + self.port);
	switch(self.schema){
	case 'http':
		callback(null, self.host +":"+ self.port 
							+ " would implement schema:" + self.schema);
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
