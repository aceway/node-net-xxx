'use strict';
var logger = require('../utils/logger.js');

var Outputter = function(schema, host, port, mode) {
	this.schema = schema;
	this.host = host;
	this.port = port;
	this.mode = mode;
};

Outputter.prototype.start = function (dataHandler, callback) {
	var self = this;
	var mode_tips = "";
	if (self.mode === "LISTEN"){
		mode_tips = "listen on "
		logger.trace("Outputter " + mode_tips + self.schema  + "://" + self.host + 
							":" + self.port);
		self.startListen(callback);
	}
	else{
		mode_tips = "connect to "
		logger.trace("Outputter " + mode_tips + self.schema  + "://" + self.host + 
							":" + self.port);
		self.startConnect(callback);
	}

};

Outputter.prototype.startListen = function( callback ) {
	var self = this;
	//logger.trace("Outputter listen on " + self.schema  + "://" + 
	//						self.host + ":" + self.port);
	switch(self.schema){
	case 'http':
		callback(null, self.host +":"+ self.port +
							" would implement schema:" + self.schema);
		break;
	case 'https':
		callback(1, self.host +":"+ self.port + 
							" would implement schema:" + self.schema);
		break;
	case 'websocket':
		callback(1, self.host +":"+ self.port + 
							" would implement schema:" + self.schema);
		break;
	case 'tcp':
		callback(1, self.host +":"+ self.port + 
							" would implement schema:" + self.schema);
		break;
	default:
		callback(-1, self.host +":"+ self.port + 
							" not surpported schema:" + self.schema);
		break;
	}
};

Outputter.prototype.startConnect = function( callback ) {
	var self = this;
	//logger.trace("Outputter connect to " + self.schema  + "://" + 
	//						self.host + ":" + self.port);
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
		callback(null, self.host +":"+ self.port 
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

module.exports = Outputter;
