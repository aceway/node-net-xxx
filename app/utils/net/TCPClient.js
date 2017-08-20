'use strict';
const net = require('net');
const logger = require('../logger.js');
const tools = require("../tools.js");
const NetBase= require("./NetBase.js");

const MAX_MSG_LEN             = 1024 * 4; // 允许对端发送的最大包长(字节单位)
const RCV_BUFFER_LEN     = 1024 * 128;       // 每个接收缓冲区初始化长度
const RCV_BUFFER_LEN_MAX = 1024 * 1024 * 64; // 每个接收缓冲区最大长度

const SND_BUFFER_LEN     = 1024 * 1024;       // 每个发送缓冲区初始化长度
const SND_BUFFER_LEN_MAX = 1024 * 1024 * 64; // 每个发送缓冲区最大长度

class TCPClient extends NetBase{
  constructor(option, handler){
    super(option, handler);
	  this.isRunning = false;
    this.socket = null;
  }
}

TCPClient.prototype.start = function () {
  let self = this;
  let promise = new Promise(function(resolve, reject){
    if (self.socket && self.isRunning === true){
      return resolve("OK");
    }
    let opt = self.option;
    self.allowHalfOpen = false;
    self.pauseOnConnect= false;
    self.socket = new net.createConnection(opt);

    self.socket.on('error', (error) => {
      if (typeof error === 'string'){
        logger.warn(self + " server socket " + self.socket._strRemote + 
                    " error: " + error);
      }
      else if(error instanceof Error){
        logger.warn(self + " server socket " + self.socket._strRemote + 
                    " error " + (error? ": " +error.message : ".") );
      }
      else{
        try{
          logger.warn(self + " server socket " + self.socket._strRemote + 
                      " error: " + JSON.stringify(error));
        }
        catch(e){
          logger.warn(self + " server socket " + self.socket._strRemote + 
                      " error: " + error);
        }
      }
      if ( !self.isRunning ){
        reject("FAILED");
      }
    });

    self.socket.on('close', (had_error) => {
      if(had_error){
        logger.warn(self + " server socket " + self.socket._strRemote +
                    " had a transmission error, so closed.");
      }
      else{
        logger.trace(self + " server socket " + self.socket._strRemote +
                    " had closed.");
      }
      self.socket._sndBf = null;
      self.socket._rcvBf = null;
    });

    self.socket.on('drain', () => {
      logger.debug(self + " server socket " + self.socket._strRemote +
                    " drain.");
      if (self.socket._sndBfDtLen > 0){
        self._sendSocketBuffer(self.socket, 60000);
      }
    });

    self.socket.on('connection', (socket) => {
      if ( !self.isRunning ){
        self.isRunning = true;
        resolve("OK");
      }
      self.socket._rcvBfLen = RCV_BUFFER_LEN; // 初始化缓冲区长度
      self.socket._rcvBf = Buffer.alloc(self.socket._rcvBfLen, 0);
      self.socket._rcvBfDtLen = 0; // 缓冲区中存储的有效数据长度
      self.socket._remote = {};
      self.socket._remote.address= self.socket.remoteAddress;
      self.socket._remote.family = self.socket.remoteFamily;
      self.socket._remote.port   = self.socket.remotePort;
      self.socket._strRemote = JSON.stringify(self.socket._remote);

    });

  });
  return promise;

};

// 优先将 socket 发送缓冲区中的数据发送出去
// 如果发送缓冲区空 则直接发送本次数据
// 否则发送后将本次数据追加到 发送缓冲末尾
// socket 的 drain 事件中也触发发送缓冲区数据
TCPClient.prototype.sendData = function (data, timeout) {
  let self = this;
  let strData = null;
  if (typeof data === 'string'){
    strData = data;
  }
  else{
    strData = JSON.stringify(data);
  }

  let ttLen = 4 + strData.length;
  let dtBf = Buffer.alloc(ttLen, 0);

  let keys = Object.keys(self.clients);
  let socket = null;
  keys.forEach(function(k){
    socket = self.clients[k];
    self.sendSocketData(socket, dtBf, timeout);
  });
};

// 给一个 socket 发送数据
const MAX_BUFFER_COPY_TIMES = 100;
TCPClient.prototype.sendSocketData = function (socket, dtBf, timeout) {
  let self = this;
  if (socket instanceof net.Socket && !socket.destroyed && 
      Buffer.isBufer(dtBf)){
    // 是否初次发送 --- 分配初始化内存
    if ( !socket.hasOwnProperty(socket._sndBfLen) || 
        !Buffer.isBuffer(socket._sndBf) ){
      socket._sndBfLen = SND_BUFFER_LEN; // 初始化缓冲区长度
      socket._sndBf = Buffer.alloc(socket._sndBfLen, 0);
      socket._sndBfDtLen = 0; // 缓冲区中待snd 的有效数据长度
    }

    // 本次数据是否会超长
    if (dtBf.length + socket._sndBfDtLen > SND_BUFFER_LEN_MAX){
      logger.error(self + " server socket " + socket._strRemote +
                   " buffer is full, could not send now...");
      return false;
    }

    // 增加发送缓冲区长度
    let cpLen = 0;
    let tmpBuffer = null;
    while(socket._sndBfLen < dtBf.length + socket._sndBfDtLen &&
          socket._sndBfLen < SND_BUFFER_LEN_MAX){
      tmpBuffer = Buffer.from(socket._sndBf);
      socket._sndBfLen += SND_BUFFER_LEN; // 增加缓冲区长度
      socket._sndBf = Buffer.alloc(socket._sndBfLen, 0);
      // 假设下面 copy 总是成功
      cpLen = tmpBuffer.copy(socket._sndBf, 0, 0, tmpBuffer.length);
      if (cpLen === tmpBuffer.length){
        logger.debug(self + " server socket " + socket._strRemote + 
                    " alloc more socket._sndBfLen:" + socket._rcvBfLen);
      }
      else{
        let tips = self + " server socket " + socket._strRemote +
                     " alloc more send buff copy failed, would close it.";
        logger.error(tips);
        socket.destroy(tips);
        return false;
      }
    }

    // 追加本次发送数据
    cpLen  = dtBf.copy(socket._sndBf, socket._sndBfDtLen, 0, dtBf.length);
    if(cpLen !==  dtBf.length){
      let tips = self + " server socket " + socket._strRemote +
                   " send data buff copy failed, would close it.";
      logger.error(tips);
      socket.destroy(tips);
      return false;
    }

    // 从缓冲区发送数据,及未发送成功的部分数据转义
    return self._sendSocketBuffer(socket, timeout);
  }
  else{
    logger.error("TCPClient.sendSocketData parameter error.");
    return false;
  }
};

TCPClient.prototype._sendSocketBuffer = function (socket, timeout) {
  let self = this;
  if (socket instanceof net.Socket && !socket.destroyed && 
      Buffer.isBufer(socket._sndBf) && socket._sndBf.length > 0){
    let cpLen = 0;
    let restLen= 0;
    let tmpBuffer = Buffer.alloc(socket._sndBfDtLen, 0);
    socket._sndBf.copy(tmpBuffer, 0, 0, socket._sndBfDtLen);
    if (true === socket.write(tmpBuffer)){
      restLen = 0;
      socket._sndBfDtLen = 0;
      socket._sndBf.fill(0, 0);
    }
    else{
      socket._sndBf.fill(0, 0);
      restLen = tmpBuffer.length - socket.bytesWritten;
      cpLen = tmpBuffer.copy(socket._sndBf, 0, socket.bytesWritten, restLen);
      if (cpLen !== restLen){
        let tips = self + " server socket " + socket._strRemote +
                     " send data rest buff copy failed, would close it.";
        logger.error(tips);
        socket.destroy(tips);
        return false;
      }
      socket._sndBfDtLen = restLen;
    }
    return true;
  }
  else{
    logger.error("TCPClient._sendSocketBuffer parameter error.");
    return false;
  }
};

module.exports = TCPClient;
