'use strict';
const logger = require('../utils/logger.js');
const PartBase = require('./partBase.js');

class ConnectPartBase extends PartBase{
  constructor(part_type, schema, host, port, 
              handler, response) {
    super('connect', part_type, schema, host, port, handler, response);
    this.part_type = part_type;
    this.schema = schema;
    this.host = host;
    this.port = port;
    this.handler = handler;
    this.response = !!response;
    this.full_name = schema + "://" + host + ":" + port + "/";
  }
}

ConnectPartBase.prototype.start = function () {
	let self = this;
  let prr = function(resolve, reject){
		reject(self.host +":"+ self.port + " not supported not, " +
           "would implement schema:" + self.schema);
  };

  let promiss = null;
	switch(self.schema){
	case 'http':
    promiss = self.startHttp();
		break;
	case 'websocket':
    promiss = new Promise(prr);
		break;
	case 'tcp':
    promiss = new Promise(prr);
		break;
	case 'https':
    promiss = new Promise(prr);
		break;
	case 'wss':
    promiss = new Promise(prr);
		break;
	default:
    promiss = new Promise(prr);
		break;
	}
  return promiss;
};

ConnectPartBase.prototype.startHttp = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] listen on " + self.full_name);
  let HttpServer = require('../utils/net/HttpServer.js');
  let httpSvr = new HttpServer(self.host, self.port, self.handler, true);
  return httpSvr.start();
};

module.exports = ConnectPartBase;
