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
  let promise = new Promise(function(resolve, reject){
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
      socket._rcvBfLen = RCV_BUFFER_LEN; // 初始化缓冲区长度
      socket._rcvBf = Buffer.alloc(socket._rcvBfLen, 0);
      socket._rcvBfDtLen = 0; // 缓冲区中存储的有效数据长度
      socket._remote = {};
      socket._remote.address= socket.remoteAddress;
      socket._remote.family = socket.remoteFamily;
      socket._remote.port   = socket.remotePort;
      socket._strRemote = JSON.stringify(socket._remote);
      self.clients[socket._clientId] = socket;

      socket.on('error', (error) => {
        if (typeof error === 'string'){
          logger.warn(self + " client socket " + socket._strRemote + 
                      " error: " + error);
        }
        else if(error instanceof Error){
          logger.warn(self + " client socket " + socket._strRemote + 
                      " error " + (error? ": " +error.message : ".") );
        }
        else{
          try{
            logger.warn(self + " client socket " + socket._strRemote + 
                        " error: " + JSON.stringify(error));
          }
          catch(e){
            logger.warn(self + " client socket " + socket._strRemote + 
                        " error: " + error);
          }
        }
      });

      socket.on('drain', () => {
        logger.debug(self + " client socket " + socket._strRemote +
                      " drain.");
        if (socket._sndBfDtLen > 0){
          self._sendSocketBuffer(socket, 60000);
        }
      });

      socket.on('close', (had_error) => {
        if(had_error){
          logger.warn(self + " client socket " + socket._strRemote +
                      " had a transmission error, so closed.");
        }
        else{
          logger.trace(self + " client socket " + socket._strRemote +
                      " had closed.");
        }
        socket._sndBf = null;
        socket._rcvBf = null;
        delete self.clients[socket._clientId];
      });

      socket.on('data', (data) => {
        if (Buffer.isBuffer(data)){
          logger.debug(self + " client socket " + 
                       socket._strRemote + " emit data.");
          // 是否需要增加缓冲区
          let cpLen = 0;
          let tmpBuffer = null;
          while (socket._rcvBf.length < RCV_BUFFER_LEN_MAX && 
                 socket._rcvBf.length < (data.length+socket._rcvBfDtLen)){
            tmpBuffer = Buffer.from(socket._rcvBf);
            socket._rcvBfLen += RCV_BUFFER_LEN;
            socket._rcvBf = Buffer.alloc(socket._rcvBfLen, 0);
            cpLen = tmpBuffer.copy(socket._rcvBf, 0, 0, tmpBuffer.length);
            if (cpLen === tmpBuffer.length){
              logger.debug(self + " client socket " + socket._strRemote + 
                          " alloc more socket._rcvBfLen:" + socket._rcvBfLen);
            }
            else{
              let tips = self + " client socket " + socket._strRemote +
                           " alloc more recv buff copy failed, would close it.";
              logger.error(tips);
              socket.destroy(tips);
              return;
            }
          }
          if (socket._rcvBf.length >= RCV_BUFFER_LEN_MAX){
            let tips = self + " client socket " + socket._strRemote +
                         " rcv buffer len is too long:" +
                         socket._rcvBf.length + ", escape its data of req";
            logger.error(tips);
            socket.destroy(tips);
            socket._rcvBfDtLen = 0; // 一旦长度非法,缓冲数据清空
            return;
          }

          // 新数据转入缓冲区, 假设下面 copy 总是成功
          cpLen = data.copy(socket._rcvBf, socket._rcvBfDtLen, 0, data.length);
          if (cpLen !== data.length){
            let tips = self + " client socket " + socket._strRemote +
                         " data buff copy failed, would close it.";
            logger.error(tips);
            socket.destroy(tips);
            return;
          }
          socket._rcvBfDtLen += data.length;

          if(socket._rcvBfDtLen < 4){ // 此时才可以解析出头四个字节---包长信息
            logger.warn(self + " client socket " + socket._strRemote +
                        " buffer data len:" + socket._rcvBf.length +
                        ", it is too short:" + socket._rcvBfDtLen + 
                        ", continue recv..." );
            return;
          }

          // 此时才可以解析出头四个字节---包长信息
          let msgLen = socket._rcvBf.readUInt32LE(0);
          if ( msgLen > socket._rcvBfDtLen ){ // 不够一个完整包
            if (msgLen > MAX_MSG_LEN){
              logger.warn(self + " client socket " + socket._strRemote + 
                          ", message len:" + msgLen + " too long than " +
                          MAX_MSG_LEN + ", would close socket...");
              socket.destroy("Message too long, would close client");
              return;
            }
            else{
              logger.warn(self + " client socket " + socket._strRemote + 
                          " buffer data len:" + socket._rcvBfDtLen + 
                          ", message len:" + msgLen + ",continue recv...");
              return;
            }
          }
          // 能够解析包了， 但有可能有多
          let msgInfo = tools.parseMessageData(socket._rcvBf, socket._rcvBfDtLen); 
          if (msgInfo === null){
            socket.destroy("The client socket " + socket._strRemote +  
                           " sent len illegal data, so closed it.");
            logger.error("The client socket " + socket._strRemote +  
                           " sent data message head " + 
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

          			let info = {'data': jsonMsg, 'part': self.full_name, 'from':socket._remote};
                self.handler(info, function(err, outputData){
                	if (err){
                	  self.sendSocketData(socket, "{code:-1, desc:'node-net-xxx process data error:" + err + "'}");
                	}
                	else{
                	  self.sendSocketData(socket, outputData);
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

    self.tcpServer.listen(self.option);
  });
  return promise;
};

// 将数据发送给所有连接的客户端
TCPServer.prototype.sendData = function (data, timeout) {
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
  let dtBf  = Buffer.alloc(ttLen, 0);
  dtBf.writeUInt32LE(ttLen);
  dtBf.write(strData, 4, btLen, 'utf8');

  let keys = Object.keys(self.clients);
  let socket = null;
  keys.forEach(function(k){
    socket = self.clients[k];
    self.sendSocketBuffer(socket, dtBf, timeout);
  });
};

// 给一个 socket 发送data
TCPServer.prototype.sendSocketData = function (socket, data, timeout) {
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
  let dtBf  = Buffer.alloc(ttLen, 0);
  dtBf.writeUInt32LE(ttLen);
  dtBf.write(strData, 4, btLen, 'utf8');

  self.sendSocketBuffer(socket, dtBf, timeout);
};

// 给一个 socket 发送buffer (填实了data)
// 		优先将 socket 发送缓冲区中的数据发送出去
// 		如果发送缓冲区空 则直接发送本次数据
// 		否则将本次数据追加到发送缓冲末尾, 然后再发生
// 		socket 的 drain 事件中也触发发送缓冲区数据
TCPServer.prototype.sendSocketBuffer = function (socket, dtBf, timeout) {
  let self = this;
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
      logger.error(self + " client socket " + socket._strRemote +
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
        logger.debug(self + " client socket " + socket._strRemote + 
                    " alloc more socket._sndBfLen:" + socket._rcvBfLen);
      }
      else{
        let tips = self + " client socket " + socket._strRemote +
                     " alloc more send buff copy failed, would close it.";
        logger.error(tips);
        socket.destroy(tips);
        return false;
      }
    }

    // 追加本次发送数据
    cpLen  = dtBf.copy(socket._sndBf, socket._sndBfDtLen, 0, dtBf.length);
    if(cpLen !==  dtBf.length){
      let tips = self + " client socket " + socket._strRemote +
                   " send data buff copy failed, would close it.";
      logger.error(tips);
      socket.destroy(tips);
      return false;
    }

    // 从缓冲区发送数据,及未发送成功的部分数据转义
    return self._sendSocketBuffer(socket, timeout);
  }
  else{
    logger.error("TCPServer.sendSocketBuffer parameter error.");
    return false;
  }
};

TCPServer.prototype._sendSocketBuffer = function (socket, timeout) {
  let self = this;
  if (socket instanceof net.Socket && !socket.destroyed && 
      Buffer.isBuffer(socket._sndBf) && socket._sndBf.length > 0){
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
        let tips = self + " client socket " + socket._strRemote +
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
    logger.error("TCPServer._sendSocketBuffer parameter error.");
    return false;
  }
};

module.exports = TCPServer;
