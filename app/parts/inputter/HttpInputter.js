'use strict';
var logger = require('../../utils/logger.js');
var HttpServer = require('../../utils/net/HttpServer.js');

var HttpInputter = function(host, port, response) {
	this.httpServer = new HttpServer(host, port, response);
	this.dataProcess = null;
};

HttpInputter.prototype.regDataProcess = function ( dataProcess ) {
	var self = this;
	if ( self.httpServer ) {
		self.httpServer.regRcvCallback( dataProcess );
	}
	else {
		logger.warn("HttpServer was not create, could not reg its callback");
	}
	this.dataProcess = dataProcess;
};

HttpInputter.prototype.start = function ( ) {
	var self = this;
	if ( self.httpServer ) {
		self.httpServer.start( );
	}
	else {
		logger.warn("HttpServer was not create, it could not be started");
	}
};


module.exports = HttpInputter;
