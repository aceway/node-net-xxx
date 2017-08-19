'use strict';
const net = require('net');
const logger = require('../logger.js');
const tools = require("../tools.js");

const RCV_CLNT_BUFFER_LEN     = 1024 * 128;       // 每个接收缓冲区初始化长度
const RCV_CLNT_BUFFER_LEN_MAX = 1024 * 1024 * 64; // 每个接收缓冲区最大长度

class TCPServer{
  constructor(option, handler){
    this.option = option;
    this.handler   = handler;
	  this.isRunning = false;
    this.full_name = "tcp://" + this.option.host + ":" + this.option.port + "/";
    this.tcpServer = null;
    this.clients= {};
    this.clientId  = 0;
  }
}

TCPServer.prototype.start = function () {
  let self = this;
  let promiss = new Promise(function(resolve, reject){
    if (self.tcpServer && self.isRunning === true){
      return resolve("OK");
    }
    let opt = self.option;
    self.allowHalfOpen = false;
    self.pauseOnConnect= false;
    self.tcpServer = new net.createServer(opt);

    self.tcpServer.on('listening', () => {
      resolve("OK");
	    logger.info("Listen TCP on: " + JSON.stringify(self.tcpServer.address()));
      if ( !self.isRunning ){
        self.isRunning = true;
      }
    });

    self.tcpServer.on('error', (error) => {
	  	let tips = "TCP error:" + error;
      logger.error(tips);
      if ( !self.isRunning ){
        reject(tips);
      }
    });
    
    self.tcpServer.on('connection', (socket) => {
      socket._clientId = ++self.clientId;
      socket._rcvBufferLen = RCV_CLNT_BUFFER_LEN;
      socket._rcvClientBuffer = new Buffer(socket._rcvBufferLen, "binary");
      socket._rcvClientBuffer.fill(0, 0);
      socket._rcvBufferDataLen = 0;
      self.clients[socket._clientId] = socket;

      socket.on('error', (error) => {
        logger.warn("The TCP socket error" + 
                      (error? ": " +error.message : ".") );
      });
      socket.on('data', (data) => {
        if (data instanceof Buffer){
          logger.debug("Buffer data.");
        }
        else if (typeof data === 'string'){
          logger.debug("String data.");
        }
        else{
          logger.warn("Unsported data typeof: " + (typeof data));
        }
      });
      socket.on('drain', () => {
      });
      socket.on('close', () => {
      });
    });

    self.tcpServer.listen(self.option);
  });
  return promiss;
};

TCPServer.prototype.sendData = function (data, timeout) {
  let self = this;
  let keys = Object.keys(self.clients);
  let socket = null;
  for(let i = 0; i < keys.length; ++i){
    socket = self.clients[keys[i]];
    if(socket instanceof net.Socket){
      let ret = socket.write(data, 'utf-8', () =>{
      });
    }
  }
};

module.exports = TCPServer;
