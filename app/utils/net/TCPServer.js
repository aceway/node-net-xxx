'use strict';
const net = require('net');
const logger = require('../logger.js');
const tools = require("../tools.js");
const NetBase= require("./NetBase.js");

const MAX_MSG_LEN             = 1024 * 4; // 允许对端发送的最大包长(字节单位)
const RCV_CLNT_BUFFER_LEN     = 1024 * 128;       // 每个接收缓冲区初始化长度
const RCV_CLNT_BUFFER_LEN_MAX = 1024 * 1024 * 64; // 每个接收缓冲区最大长度

class TCPServer extends NetBase{
  constructor(option, handler){
    super(option, handler);
	  this.isRunning = false;
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
      socket._rcvBfLen = RCV_CLNT_BUFFER_LEN; // 初始化缓冲区长度
      socket._rcvBf = new Buffer(socket._rcvBfLen);
      socket._rcvBf.fill(0, 0);
      socket._rcvBfDtLen = 0; // 缓冲区中存储的有效数据长度
      socket._strAddress = JSON.stringify(socket.address());
      self.clients[socket._clientId] = socket;

      socket.on('error', (error) => {
        if (typeof error === 'string'){
          logger.warn(self + " client TCP socket " + socket._strAddress + 
                      " error" + error);
        }
        else if(error instanceof Error){
          logger.warn(self + " client TCP socket " + socket._strAddress + 
                      " error" + (error? ": " +error.message : ".") );
        }
        else{
          try{
            logger.warn(self + " client TCP socket " + socket._strAddress + 
                        " error: " + JSON.stringify(error));
          }
          catch(e){
            logger.warn(self + " client TCP socket " + socket._strAddress + 
                        " error: " + error);
          }
        }
      });

      socket.on('data', (data) => {
        if (data instanceof Buffer){
          logger.debug("socket emit data.");
          while (socket && socket._rcvBf.length < RCV_CLNT_BUFFER_LEN_MAX && 
                 socket._rcvBf.length < (data.length+socket._rcvBfDtLen)){
            let tmpBuffer = new Buffer(socket._rcvBfLen);
            socket._rcvBf.copy(tmpBuffer, 0, 0, socket._rcvBfLen);
            socket._rcvBf = null;
            socket._rcvBfLen += RCV_CLNT_BUFFER_LEN;
            socket._rcvBf = new Buffer(socket._rcvBfLen);
            socket._rcvBf.fill(0, 0);
            tmpBuffer.copy(socket._rcvBf, 0, 0, tmpBuffer.length);

            logger.debug(self + " socket [" + socket._strAddress + 
                         "] socket._rcvBfLen:" + socket._rcvBfLen);
          }
          if (socket && socket._rcvBf.length >= RCV_CLNT_BUFFER_LEN_MAX){
            let tips = self + " socket [" + socket._strAddress +
                         "] rcv buffer len is too long:" +
                         socket._rcvBf.length + ", escape its data of req";
            logger.error(tips);
            socket.destroy(tips);
            socket._rcvBfDtLen = 0; // 一旦长度非法,缓冲数据清空
            return;
          }

          // 新数据转入缓冲区
          data.copy(socket._rcvBf, socket._rcvBfDtLen, 0, data.length);
          socket._rcvBfDtLen += data.length;

          // 是否可解包 及其解包的处理
          if(socket && socket._rcvBfDtLen >= 4){ // 此时才可以解析出头四个字节---包长信息
            let msgLen = socket._rcvBf.readUInt32LE(0);
            if ( msgLen > socket._rcvBfDtLen ){ // 不够一个完整包
              if (msgLen > MAX_MSG_LEN){
                logger.warn(self + " socket [" + socket._strAddress + 
                            ", message len:" + msgLen + " too long than " +
                            MAX_MSG_LEN + ", would close socket...");
                socket.destroy("Message too long, would close client");
                return;
              }
              else{
                logger.warn(self + " socket [" + socket._strAddress + 
                            " buffer data len:" + socket._rcvBfDtLen + 
                            ", message len:" + msgLen + ",continue recv...");
                return;
              }
            }
            // 能够解析包了， 但有可能有多
            let msgInfo = tools.parseMessageData(socket._rcvBf, socket._rcvBfDtLen); 
            if (msgInfo === null){
              socket.destroy("The client send socket data message head " + 
                             "len illegal, so closed it.");
              logger.error("The client send socket data message head " + 
                           "len illegal, so closed it.");
              socket._rcvBf = null;
              socket.destroy("The client send data message illegal.");
              return;
            }

            if (msgInfo.restLen > 0){
              socket._rcvBfDtLen = msgInfo.restLen;
              // 数据移动已经在 parseMessageData(...) 中完成
            }
            else{
              socket._rcvBfDtLen = 0;
            }

            // 某些情况下需要同步处理(如后继包对前面某个包业务强依赖，
            // 但这几个包一次网络event到到服务端应用层---客户端未做等待返回后再请求)，暂时异步处理
            if ( msgInfo && Array.isArray(msgInfo.messages) ){
              let packet = null;
              msgInfo.messages.forEach(function(msg){
                if ( msg && typeof self.handler === 'function' ) {
                  // TODO: 
                  //if (self.option.response){
                  //}
                  //self.handler(msg,function(err, outputData){
                  //  // TODO socket.sendData()
                  //});
                }
              });
            }
          }
          else { // 不够解包长度信息的
            logger.warn(self + " socket [" + socket._strAddress +
                        " buffer data len:" + socket._rcvBf.length +
                        ", it is too short:" + socket._rcvBfDtLen + 
                        ", continue recv..." );
          }
        }
        else if (typeof data === 'string'){
          logger.warn("String data, would surpported...");
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
