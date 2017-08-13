'use strict';
const logger = require('../utils/logger.js');
const PartBase = require('./partBase.js');

class ConnectPartBase extends PartBase{
  constructor(part_type, schema, host, port, 
              handler, response) {
    super('connect', part_type, schema, host, port, handler, response);
  }
}

ConnectPartBase.prototype.connect = function () {
	let self = this;
  let prr = function(resolve, reject){
		reject(self.host +":"+ self.port + " not supported not, " +
           "would implement schema:" + self.schema);
  };

  let promiss = null;
	switch(self.schema){
	case 'http':
    promiss = self.connectHttp();
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

ConnectPartBase.prototype.connectHttp = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] connect to " + self.id);
  let HttpClient = require('../utils/net/HttpClient.js');
  return new HttpClient(self.host, self.port, self.handler, true).connect();
};

module.exports = ConnectPartBase;
