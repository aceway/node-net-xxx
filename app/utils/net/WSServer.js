'use strict';
const logger = require('../logger.js');
const WebSocket = require('ws');

class WSServer{
  constructor(option, handler){
    this.option = option;
    this.handler   = handler;
	  this.isRunning = false;
    this.full_name = "ws://" + this.option.host + ":" + this.option.port + "/";
    this.wsServer  = null;
    this.wsClients = {};
  }
}

WSServer.prototype.start = function () {
  let self = this;
  let promiss = new Promise(function(resolve, reject){
    if (self.wsServer && self.isRunning === true){
      return resolve("OK");
    }
    let opt = self.option;
    //opt.backlog {Number} The maximum length of the queue of pending connections
    //opt.verifyClient {Function} A function which can be used to validate incoming 
    //opt.connections. See description below.
    //opt.perMessageDeflate {Boolean|Object} Enable/disable permessage-deflate.
    //opt.maxPayload {Number} The maximum allowed message size in bytes.
    self.wsServer = new WebSocket.Server(opt);
    self.wsServer.on('listening', function connection(ws) {
      resolve("OK");
	    logger.info("Listen WebSocket on ws://" + opt.host + ":" + opt.port + "/");
      if ( !self.isRunning ){
        self.isRunning = true;
      }
    });

    self.wsServer.on('error', function connection(e) {
	  	let tips = "WebSocket error:" + e;
      logger.error(tips);
      if ( !self.isRunning ){
        reject(tips);
      }
    });
    
    self.wsServer.on('connection', function connection(ws) {
      ws.on('message', function incoming(message) {
        logger.debug(self.option.schema + 
                    ' webSocket server rcv msg:' + message);
        if (typeof self.handler === 'function'){
          self.handler(message, function(error, result){
            if (['inputter', 'monitor'].indexOf(self.option.part_type) >= 0 && 
                self.option.response){
              if (error){
                ws.send("node-net-xxx process data error: " + error);
              }
              else{
                ws.send(result);
              }
            }
          });
        }
      });
    });
  });
  return promiss;
};

WSServer.prototype.sendData = function (data, timeout) {
  let self = this;
  if (self.wsServer && self.wsServer.clients){
    self.wsServer.clients.forEach(function(ws){
      if (typeof ws.send === 'function'){
        ws.send(data);
      }
    });
  }
};

module.exports = WSServer;
