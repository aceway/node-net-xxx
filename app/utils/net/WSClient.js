'use strict';
const logger = require('../logger.js');
const WebSocket = require('ws');

class WSClient{
  constructor(option, handler){
    this.option = option;
    this.handler   = handler;
	  this.isRunning = false;
    this.full_name = "ws://" + this.option.host + ":" + this.option.port + "/";
    this.wsClients = {};
  }
}

WSClient.prototype.start = function () {
  let self = this;
  let promiss = new Promise(function(resolve, reject){
    if (self.wsClient && self.isRunning === true){
      return resolve("OK");
    }
    let opt = self.option;
    self.wsClient = new WebSocket('ws://' + opt.host + ":" + opt.port + "/");
    self.wsClient.on('open', function open(ws) {
      resolve("OK");
	    logger.info("Open WebSocket on ws://" + opt.host + ":" + opt.port + "/");
      if ( !self.isRunning ){
        self.isRunning = true;
      }
    });

    self.wsClient.on('error', function connection(e) {
	  	let tips = "WebSocket error:" + e;
      logger.error(tips);
      if ( !self.isRunning ){
        reject(tips);
      }
    });

    self.wsClient.on('message', function incoming(data) {
	  	let tips = "WebSocket message: " + data;
      logger.debug(tips);
    });
  });
  return promiss;
};

WSClient.prototype.sendData = function (data, timeout) {
  let self = this;
  if (self.wsClient && self.wsClient.send){
    self.wsClient.clients.forEach(function(ws){
      self.wsClient.send(data);
    });
  }
};

module.exports = WSClient;
