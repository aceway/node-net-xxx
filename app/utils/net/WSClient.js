'use strict';
const logger = require('../logger.js');
const WebSocket = require('ws');

class WSClient{
  constructor(option, handler){
    this.option = option;
    this.handler   = handler;
	  this.isRunning = false;
    this.full_name = "ws://" + this.option.host + ":" + this.option.port + "/";
    this.wsClient  = null;
  }
}

WSClient.prototype.connect = function () {
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

    self.wsClient.on('message', function incoming(message) {
      logger.debug(self.option.schema + 
                   ' webSocket client rcv msg:' + message);
      if (typeof self.handler === 'function'){
        self.handler(message, function(error, result){
          if (['inputter', 'monitor'].indexOf(self.option.schema) >= 0 && 
              self.option.response){
            if (error){
              self.sendData("node-net-xxx process data error: " + error);
            }
            else{
              self.sendData(result);
            }
          }
        });
      }
    });
  });
  return promiss;
};

WSClient.prototype.sendData = function (data, timeout) {
  let self = this;
  if (self.wsClient && typeof self.wsClient.send === 'function'){
    if (typeof data === 'string'){
      self.wsClient.send(data);
    }
    else{
      try{
        const strData = JSON.stringify(data);
        self.wsClient.send(strData);
      }
      catch(e){
        self.wsClient.send(e + "");
      }
    }
  }
};

module.exports = WSClient;
