'use strict';
const logger = require('./logger.js');
let tools = {};

tools.getReqIp = function(req){
  return (req || "error req") && 
         ((req.headers && req.headers['x-forwarded-for']) ||
         (req.connection && req.connection.remoteAddress) ||
         (req.socket && req.socket.remoteAddress) ||
         (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
         "Uknown remot IP");
};

function dumpBuffer(binBuffer, len){
  let str = "";
  for(let i=0 ; i<len && i <binBuffer.length; ++i){
    str += binBuffer[i].toString(16); 
  }
  return str;
}

const MAX_MSG_LEN = 1024 * 4; // 允许对端发送的最大包长(字节单位)
const MAX_MSG_CNT = 250;      // 允许缓冲区里最多容纳打消息个数

// 从流缓冲区里解析出消息包
//     每个消息包以 uint32 开头,该数值指明其所在消息包长度(包含本uint32大小)
//     缓冲区中可能都任意多个消息包,最后一个甚至可能时半包
// 参数:
//      binBuffer: 存储数据的缓冲区
//      dataLen: 指明binBuffer中有效数据长度(从binBuffer的0位置开始算)
// 返回: 
//      null: binBuffer 中的数据非法
//      {messages:[], restLen:N}, 成功解析出的数据信息,
//            messages: 解析出的完整消息数据包被一个个放入该列表中
//            restLen: 不能完整解析的消息包剩余长度, 
//                    剩余数据已经移动到传入参数的binBuffer的0位置开始
tools.parseMessageData = function(binBuffer, dataLen, maxMsgLen, maxMsgCnt){
  if (!maxMsgLen) { maxMsgLen = MAX_MSG_LEN;}
  if (!maxMsgCnt) { maxMsgCnt = MAX_MSG_CNT;}

  let msgDataInfo = {messages:[], restLen:0};
  let offset = 0;
  let idx = 0;
  while(true) {
    let msgLen = binBuffer.readUInt32LE(offset);
    if (msgLen === dataLen){
      logger.debug("Got the [idx:"+idx+"] message len:" + msgLen + 
                   ", all of this binBuffer data len:" + dataLen);
    }
    else{
      logger.warn("Got the [idx:"+idx+"] message len:" + msgLen + 
                  ", part of this binBuffer data len:" + dataLen);
    }
    if (msgLen === 0) { // 避免客户端发恶意包使此处进入死循环
      logger.error("Rcv data is illegal, with offset ["+offset +
                   "] in the binBuffer: message len in header is 0, " +
                   "should close the client! The rcv binBuffer data(" +
                   dataLen+"): " + dumpBuffer(binBuffer, dataLen) );
      return null;
    }
    if (msgLen > maxMsgLen) { // 避免客户端发恶意大包耗服务器内存资源性能
      logger.error("Rcv data is illegal, with offset [" + offset +
                   "] in the binBuffer: message len in header is " + msgLen +
                    ", max than max client message len:"+maxMsgLen +
                    ", should close the client!");
      return null;
    }

    if ( (offset + msgLen) > dataLen ) {
      // 剩余不够，转移数据
      msgDataInfo.restLen = dataLen - offset;
      let tmpBuff = new Buffer(msgDataInfo.restLen, "binary");
      binBuffer.copy( tmpBuff, 0, offset, offset+msgDataInfo.restLen );
      binBuffer.fill(0, 0);
      tmpBuff.copy(binBuffer, 0, 0, msgDataInfo.restLen);
      logger.debug("Got the [idx:"+idx+"] message data is scrap part, " +
                   "has received len:" + msgDataInfo.restLen);
      break;
    }
    else {
      // 可以取到一个完整包
      let msgBuffer = new Buffer(msgLen, "binary");
      binBuffer.copy(msgBuffer, 0, offset, offset+msgLen);
      msgDataInfo.messages.push(msgBuffer);
      offset += msgLen;
      if (offset === dataLen){
        msgDataInfo.restLen = 0;
        binBuffer.fill(0, 0);
        logger.debug("Got all of a message data.");
        break;
      }
    }
    idx += 1;
    if ( idx > maxMsgCnt ){ // 避免恶意对端发大量小包耗服务器性能
      logger.error("Rcv data is illegal, more than " + maxMsgCnt + 
                   " small message reqs. should close the client!");
      return null;
    }
  }
  return msgDataInfo;
};

module.exports = tools;
