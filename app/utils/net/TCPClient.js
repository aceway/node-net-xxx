'use strict';
const net = require('net');
const logger = require('../logger.js');
const tools = require("../tools.js");
const NetBase= require("./NetBase.js");

const MAX_MSG_LEN        = 1024 * 4; 					// 允许对端发送的最大包长(字节单位)
const RCV_BUFFER_LEN     = 1024 * 128;       	// 每个接收缓冲区初始化长度
const RCV_BUFFER_LEN_MAX = 1024 * 1024 * 64; 	// 每个接收缓冲区最大长度

const SND_BUFFER_LEN     = 1024 * 1024;       // 每个发送缓冲区初始化长度
const SND_BUFFER_LEN_MAX = 1024 * 1024 * 64; 	// 每个发送缓冲区最大长度

class TCPClient extends NetBase{
  constructor(option, handler){
    super(option, handler);
	  this.isRunning = false;
    this.socket = null;
  }
}

TCPClient.prototype.connect = function () {
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

    self.socket.on('data', (data) => {
      if (Buffer.isBuffer(data)){
        logger.debug(self + " server socket " + 
                     self.socket._strRemote + " emit data.");
        // 是否需要增加缓冲区
        let cpLen = 0;
        let tmpBuffer = null;
        while (self.socket._rcvBf.length < RCV_BUFFER_LEN_MAX && 
               self.socket._rcvBf.length < (data.length+self.socket._rcvBfDtLen)){
          tmpBuffer = Buffer.from(self.socket._rcvBf);
          self.socket._rcvBfLen += RCV_BUFFER_LEN;
          self.socket._rcvBf = Buffer.alloc(self.socket._rcvBfLen, 0);
          cpLen = tmpBuffer.copy(self.socket._rcvBf, 0, 0, tmpBuffer.length);
          if (cpLen === tmpBuffer.length){
            logger.debug(self + " server socket " + self.socket._strRemote + 
                        " alloc more socket._rcvBfLen:" + self.socket._rcvBfLen);
          }
          else{
            let tips = self + " server socket " + self.socket._strRemote +
                         " alloc more recv buff copy failed, would close it.";
            logger.error(tips);
            self.socket.destroy(tips);
            return;
          }
        }
        if (self.socket._rcvBf.length >= RCV_BUFFER_LEN_MAX){
          let tips = self + " server socket " + self.socket._strRemote +
                       " rcv buffer len is too long:" +
                       self.socket._rcvBf.length + ", escape its data of req";
          logger.error(tips);
          self.socket.destroy(tips);
          self.socket._rcvBfDtLen = 0; // 一旦长度非法,缓冲数据清空
          return;
        }

        // 新数据转入缓冲区, 假设下面 copy 总是成功
        cpLen = data.copy(self.socket._rcvBf, self.socket._rcvBfDtLen, 0, data.length);
        if (cpLen !== data.length){
          let tips = self + " server socket " + self.socket._strRemote +
                       " data buff copy failed, would close it.";
          logger.error(tips);
          self.socket.destroy(tips);
          return;
        }
        self.socket._rcvBfDtLen += data.length;

        if(self.socket._rcvBfDtLen < 4){ // 此时才可以解析出头四个字节---包长信息
          logger.warn(self + " server socket " + self.socket._strRemote +
                      " buffer data len:" + self.socket._rcvBf.length +
                      ", it is too short:" + self.socket._rcvBfDtLen + 
                      ", continue recv..." );
          return;
        }

        // 此时才可以解析出头四个字节---包长信息
        let msgLen = self.socket._rcvBf.readUInt32LE(0);
        if ( msgLen > self.socket._rcvBfDtLen ){ // 不够一个完整包
          if (msgLen > MAX_MSG_LEN){
            logger.warn(self + " server socket " + self.socket._strRemote + 
                        ", message len:" + msgLen + " too long than " +
                        MAX_MSG_LEN + ", would close socket...");
            self.socket.destroy("Message too long, would close server");
            return;
          }
          else{
            logger.warn(self + " server socket " + self.socket._strRemote + 
                        " buffer data len:" + self.socket._rcvBfDtLen + 
                        ", message len:" + msgLen + ",continue recv...");
            return;
          }
        }
        // 能够解析包了， 但有可能有多
        let msgInfo = tools.parseMessageData(self.socket._rcvBf, self.socket._rcvBfDtLen); 
        if (msgInfo === null){
          self.socket.destroy("The server socket " + self.socket._strRemote +  
                         " sent len illegal data, so closed it.");
          logger.error("The server socket " + self.socket._strRemote +  
                         " sent data message head " + 
                         "len illegal, so closed it.");
          self.socket._rcvBf = null;
          self.socket.destroy("The server send data message illegal.");
          return;
        }

        if (msgInfo.restLen > 0){
          self.socket._rcvBfDtLen = msgInfo.restLen;
          // 数据移动已经在 parseMessageData(...) 中完成
        }
        else{
          self.socket._rcvBfDtLen = 0;
        }

        // 某些情况下需要同步处理(如后继包对前面某个包业务强依赖，
        // 但这几个包一次网络event到到服务端应用层---客户端未做等待返回后再请求)，暂时异步处理
        if ( msgInfo && Array.isArray(msgInfo.messages) ){
          let packet = null;
          msgInfo.messages.forEach(function(msg){
            if ( msg && typeof self.handler === 'function' ) {
              let strMsg = null;
              if (typeof msg === 'string'){
                //logger.debug("Get string msg len:" + msg.length);
                strMsg = msg;
              }
              else if( Buffer.isBuffer(msg) ){
                //logger.debug("Get buff msg len:" + msg.length);
                strMsg = msg.toString('utf8');
              }
              else{
                logger.error("Unsported tcp msg type: " + typeof msg);
                return;
              }
              //logger.debug("Get tcp msg: " + strMsg);

              let jsonMsg = null;
              try{
                jsonMsg = JSON.parse(strMsg);
              }
              catch(e){
                logger.error("JSON.parse("+strMsg+") exception: " + e);
                return;
              }
              if (!jsonMsg){
                logger.error("JSON.parse("+strMsg+") return null: " + jsonMsg);
                return;
              }

          		let info = {'data': jsonMsg, 'part': self.full_name, 'from':self.socket._remote};
              self.handler(info, function(err, outputData){
                if (err){
                  self.sendData("{code:-1, desc:'node-net-xxx process data error:" + err + "'}");
                }
                else{
                  self.sendData(outputData);
                }
              });
            }
          });
        }
      }
      else if (typeof data === 'string'){
        logger.warn("String data, would surpported...");
      }
      else{
        logger.warn("Unsported data typeof: " + (typeof data));
      }
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
  let btLen = Buffer.byteLength(strData, 'utf8');

  let ttLen = 4 + btLen;
  let dtBf = Buffer.alloc(ttLen, 0);
  dtBf.writeUInt32LE(ttLen);
  dtBf.write(strData, 4, btLen, 'utf8');

  //logger.debug(self + " TCPClient.sendData len:" + dtBf.length);
  self.sendSocketBuffer(self.socket, dtBf, timeout);

};

// 给一个 socket 发送数据
TCPClient.prototype.sendSocketBuffer = function (socket, dtBf, timeout) {
  let self = this;
  //logger.debug(self + " TCPClient.sendSocketBuffer 1 len:" + dtBf.length);
  if (socket instanceof net.Socket && !socket.destroyed && 
      Buffer.isBuffer(dtBf)){
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
    socket._sndBfDtLen += cpLen;

    // 从缓冲区发送数据,及未发送成功的部分数据转义
    //logger.debug(self + " TCPClient.sendSocketBuffer 2 len:" + dtBf.length);
    return self._sendSocketBuffer(socket, timeout);
  }
  else{
    logger.error(self + " TCPClient.sendSocketBuffer parameter error.");
    return false;
  }
};

TCPClient.prototype._sendSocketBuffer = function (socket, timeout) {
  let self = this;
  if (socket instanceof net.Socket && !socket.destroyed && 
      Buffer.isBuffer(socket._sndBf) && socket._sndBf.length > 0){
    let cpLen = 0;
    let restLen= 0;
    let tmpBuffer = Buffer.alloc(socket._sndBfDtLen, 0);
    socket._sndBf.copy(tmpBuffer, 0, 0, socket._sndBfDtLen);
    //logger.debug(self + " TCP._sendSocketBuffer socket.write len: " + tmpBuffer.length);
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
    //logger.debug(self + " TCP._sendSocketBuffer len: " + tmpBuffer.length);
    return true;
  }
  else{
    logger.error(self + " TCPClient._sendSocketBuffer parameter error.");
    return false;
  }
};

module.exports = TCPClient;
