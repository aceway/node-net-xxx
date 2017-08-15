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
    });

    self.wsServer.on('error', function connection(ws) {
    });
    
    self.wsServer.on('connection', function connection(ws) {
      ws.on('message', function incoming(message) {
        console.log('received: %s', message);
      });
    
    });
  });
  return promiss;
};

WSServer.prototype.sendData = function () {
};

module.exports = WSServer;
