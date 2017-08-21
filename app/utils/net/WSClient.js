'use strict';
const WebSocket = require('ws');

const logger = require('../logger.js');
const NetBase= require("./NetBase.js");

class WSClient extends NetBase{
  constructor(option, handler){
    super(option, handler);
	  this.isRunning = false;
    this.wsClient  = null;
  }
}

WSClient.prototype.connect = function () {
  let self = this;
  let promise = new Promise(function(resolve, reject){
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
        let from = self.option.host;
        let data = null;
        if (typeof message === 'string'){
          try{
            data = JSON.parse(message);
          }
          catch(e){
            data = message + "";
          }
        }
        else{
          data = message;
        }

        let info = {'data': data, 'part': self.full_name, 'from':from};
        self.handler(info, function(error, result){
          if (typeof result !== 'string'){
            result = JSON.stringify(result);
          }
          if (['inputter', 'monitor'].indexOf(self.option.schema) >= 0){
            if (err){
              self.sendData("{code:-1, desc:'node-net-xxx process data error:" + err + "'}");
            }
            else{
              self.sendData(outputData);
            }
          }
        });
      }
    });
  });
  return promise;
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
