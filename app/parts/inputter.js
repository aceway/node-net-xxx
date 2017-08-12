'use strict';
var logger = require('../utils/logger.js');

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

Inputter.prototype.start = function (dataHandler, callback) {
	var self = this;
	//logger.trace("Inputter listen on " + self.schema  + "://" + 
	//						self.host + ":" + self.port);
	switch(self.schema){
	case 'http':
    self.startHttp(dataHandler, callback);
    break;
  case 'https':
    self.startHttps(dataHandler, callback);
    break;
  case 'websocket':
    self.startWebSocket(dataHandler, callback);
    break;
  case 'tcp':
    self.startTcp(dataHandler, callback);
    break;
  default:
    callback(-1, self.host +":"+ self.port 
              + " not surpported schema:" + self.schema);
    break;
  }
};

Inputter.prototype.startHttp = function (dataHandler, callback) {
  var self = this;
	if ( self.httpInputter === undefined ){
		var HttpInputter = require('./inputter/HttpInputter.js');
		self.httpInputter = new HttpInputter(self.host, self.port, self.response);
	}
  if ( self.httpInputter === undefined ){
    callback(1, self.host +":"+ self.port 
              + " schema:" + self.schema + " failed." );
  }
  else {
    self.httpInputter.regDataProcess( dataHandler.dataProcess );
    callback(null, self.host +":"+ self.port 
              + " schema:" + self.schema);
    self.httpInputter.start();
  }
}

Inputter.prototype.startHttps = function (dataHandler, callback) {
  callback(1, self.host +":"+ self.port 
           + " would implement schema:" + self.schema);
}

Inputter.prototype.startWebSocket = function (dataHandler, callback) {
  callback(1, self.host +":"+ self.port 
           + " would implement schema:" + self.schema);
}

Inputter.prototype.startTcp = function (dataHandler, callback) {
  callback(1, self.host +":"+ self.port 
           + " would implement schema:" + self.schema);
}

module.exports = Inputter;
