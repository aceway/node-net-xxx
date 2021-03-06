'use strict';
const logger = require('../utils/logger.js');
const PartBase = require('./partBase.js');

class ConnectPartBase extends PartBase{
  constructor(part_type, part_cfg, handler) {
    super('connect', part_type, part_cfg, handler);
  }
}

ConnectPartBase.prototype.connect = function () {
	let self = this;
  let prr = function(resolve, reject){
		reject(self.part_cfg.host +":"+ self.part_cfg.port + " not supported not, " +
           "would implement schema:" + self.part_cfg.schema);
  };

  let promise = null;
	switch(self.schema){
	case 'http':
    promise = self.connectHttp();
		break;
	case 'ws':
    promise = self.connectWs();
		break;
	case 'tcp':
    promise = self.connectTcp();
		break;
	default:
    promise = new Promise(prr);
		break;
	}
  return promise;
};

ConnectPartBase.prototype.connectHttp = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] connect to " + self.id);
  let HttpClient = require('../utils/net/HttpClient.js');
  self.net = new HttpClient(self.part_cfg, self.handler);
  return self.net.connect();
};

ConnectPartBase.prototype.connectWs = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] connect to " + self.id);
  let WSClient = require('../utils/net/WSClient.js');
  self.net = new WSClient(self.part_cfg, self.handler);
  return self.net.connect();
};

ConnectPartBase.prototype.connectTcp = function () {
  let self = this;
	logger.trace("Try start ["+self.part_type+"] connect to " + self.id);
  let TCPClient = require('../utils/net/TCPClient.js');
  self.net = new TCPClient(self.part_cfg, self.handler);
  return self.net.connect();
};

module.exports = ConnectPartBase;
