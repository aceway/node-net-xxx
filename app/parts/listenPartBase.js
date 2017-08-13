'use strict';
const logger = require('../utils/logger.js');
const PartBase = require('./partBase.js');

class ListenPartBase extends PartBase {
  constructor(part_type, schema, host, port, 
              handler, response) {
    super('listen', part_type, schema, host, port, handler, response);
  }
}

ListenPartBase.prototype.start = function () {
	let self = this;
  let prr = function(resolve, reject){
		reject(self.host +":"+ self.port + " not supported not, " +
           "would implement schema:" + self.schema);
  };

  let promiss = null;
	switch(self.schema){
	case 'http':
    promiss = self.startHttpListen();
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

ListenPartBase.prototype.startHttpListen = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] listen on " + self.id);
  let HttpServer = require('../utils/net/HttpServer.js');
  let httpSvr = new HttpServer(self.host, self.port, self.handler, true);
  return httpSvr.start();
};

module.exports = ListenPartBase;
