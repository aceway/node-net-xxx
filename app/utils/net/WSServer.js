'use strict';
const WebSocket = require('ws');
const logger = require('../logger.js');
const tools = require("../tools.js");
const NetBase= require("./NetBase.js");

class WSServer extends NetBase{
  constructor(option, handler){
    super(option, handler);
	  this.isRunning = false;
    this.wsServer  = null;
    this.wsClients = {};
  }
}

WSServer.prototype.start = function () {
  let self = this;
  let promise = new Promise(function(resolve, reject){
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
	    //logger.info("Listen WebSocket on: " + JSON.stringify(self.wsServer.address()));
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
    
    self.wsServer.on('connection', function connection(ws, req) {
      ws.on('message', function incoming(message) {
        logger.debug(self.option.schema + 
                    ' webSocket server rcv msg:' + message);
        if (typeof self.handler === 'function'){
          let from = tools.getReqIp(req);
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
            if (['inputter', 'monitor'].indexOf(self.option.part_type) >= 0){
              if (error){
                ws.send("{code:-1, desc:'node-net-xxx process data error: " + 
											  error + "'}");
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
  return promise;
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
