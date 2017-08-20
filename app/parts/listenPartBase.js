'use strict';
const logger = require('../utils/logger.js');
const PartBase = require('./partBase.js');

class ListenPartBase extends PartBase {
  constructor(part_type, part_cfg, handler) {
    super('listen', part_type, part_cfg, handler);
  }
}

ListenPartBase.prototype.start = function () {
	let self = this;
  let prr = function(resolve, reject){
		reject(self.part_cfg.host +":"+ self.part_cfg.port + " not supported not, " +
           "would implement schema:" + self.schema);
  };

  let promise = null;
	switch(self.schema){
	case 'http':
    promise = self.startHttpListen();
		break;
	case 'ws':
    promise = self.startWsListen();
		break;
	case 'tcp':
    promise = self.startTcpListen();
		break;
	case 'https':
    promise = new Promise(prr);
		break;
	case 'wss':
    promise = new Promise(prr);
		break;
	default:
    promise = new Promise(prr);
		break;
	}
  return promise;
};

ListenPartBase.prototype.startHttpListen = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] listen on " + self.id);
  let HttpServer = require('../utils/net/HttpServer.js');
  self.net = new HttpServer(self.part_cfg, self.handler);
  return self.net.start();
};

ListenPartBase.prototype.startWsListen = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] listen on " + self.id);
  let WSServer = require('../utils/net/WSServer.js');
  self.net = new WSServer(self.part_cfg, self.handler);
  return self.net.start();
};

ListenPartBase.prototype.startTcpListen = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] listen on " + self.id);
  let TCPServer = require('../utils/net/TCPServer.js');
  self.net = new TCPServer(self.part_cfg, self.handler);
  return self.net.start();
};

module.exports = ListenPartBase;
