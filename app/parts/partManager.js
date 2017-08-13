'use strict';
const logger = require('../utils/logger.js');
const PartBase = require('./partBase.js');

class PartManager {
  constructor(){
    this.up_time = new Date().getTime();
    this.container = {};    // id -> Obj 容器
    this.schema  = {};      // chema -> id => container ref
    this.part_type  = {};   // part_type -> id => container ref
  }
}

// 参数ID在里面为合法对象 则为真,否则假
PartManager.prototype.hasPartId = function(ptId){
  if (ptId){
    if (this.container[ptId] instanceof PartBase) {
      return true;
    }
    else{
      return false;
    }
  }
  else{
    return false;
  }
};

// 参数对象合法且存在 则为真,否则假
PartManager.prototype.hasPartObj = function(ptObj){
  if (ptObj instanceof PartBase && ptObj.id && ptObj.schema && ptObj.part_type){
    if (this.container[ptObj.id] instanceof PartBase) {
      return true;
    }
    else{
      return false;
    }
  }
  else{
    logger.error("The ptObj parameter is ilegal:" + ptObj);
    return false;
  }
};

// 无则添加, 有则直接返回
PartManager.prototype.addOnePart = function(ptObj){
  if (ptObj instanceof PartBase && ptObj.id && ptObj.schema && ptObj.part_type){
    if (this.container[ptObj.id] instanceof PartBase) {
      logger.warn("THe part has bin mananger: " + ptObj);
      return false;
    }
    else{
      this.container[ptObj.id] = ptObj;
      if (this.schema[ptObj.schema]){
        this.schema[ptObj.schema][ptObj.id] = this.container[ptObj.id];
      }
      else{
        this.schema[ptObj.schema] = {};
        this.schema[ptObj.schema][ptObj.id] = this.container[ptObj.id];
      }
      if (this.part_type[ptObj.part_type]){
        this.part_type[ptObj.part_type][ptObj.id] = this.container[ptObj.id];
      }
      else{
        this.part_type[ptObj.part_type] = {};
        this.part_type[ptObj.part_type][ptObj.id] = this.container[ptObj.id];
      }
      return true;
    }
  }
  else{
    logger.error("The ptObj parameter is ilegal:" + ptObj);
    return false;
  }
};

// 无则添加,有责替换
PartManager.prototype.updateOnePart = function(ptObj){
  if (ptObj instanceof PartBase && ptObj.id && ptObj.schema && ptObj.part_type){
    this.container[ptObj.id] = ptObj;
    if (this.schema[ptObj.schema]){
      this.container[ptObj.schema][ptObj.id] = ptObj;
    }
    else{
      this.container[ptObj.schema] = {};
      this.schema[ptObj.schema][ptObj.id] = this.container[ptObj.id];
    }
    if (this.part_type[ptObj.part_type]){
      this.container[ptObj.part_type][ptObj.id] = ptObj;
    }
    else{
      this.container[ptObj.part_type] = {};
      this.part_type[ptObj.part_type][ptObj.id] = this.container[ptObj.id];
    }
    return true;
  }
  else{
    logger.error("The ptObj parameter is ilegal:" + ptObj);
    return false;
  }
};

// 通过器件 id 查询器件
PartManager.prototype.getOnePartId = function(ptId){
  if (this.hasPartId(ptId)){
    return this.container[ptId];
  }
  else{
    return null;
  }
};

// 通过器件 id 删除器件
PartManager.prototype.delOnePartId = function(ptId){
  let ptObj = this.getOnePartId(ptId);
  if (ptObj){
    delete this.schema[ptObj.schema][ptId];
    delete this.part_type[ptObj.part_type][ptId];
    delete this.container[ptId];
    return true;
  }
  else{
    return false;
  }
};

// 通过器件 id 给器件连接的对端发送数据
PartManager.prototype.sendData2Part = function(ptId, data){
  let ptObj = this.getOnePartId(ptId);
  if (ptObj){
    if (typeof ptObj.sendData === 'function'){
      return ptObj.sendData(data);
    }
    else{
      logger.warn("Could not send to data, because the part obj has no " +
                  "function sendData not in mananger: " + ptId);
      return false;
    }
  }
  else{
    logger.warn("Could not send to data, because " +
                "the part id not in mananger: " + ptId);
    return false;
  }
};

// 给一种 schema 的器件对端发送数据
// schema: http, ws, tcp....
PartManager.prototype.sendData2Schema = function(schema, data){
  if (this.schema[schema]){
    let sent = false;
    let keys = Object.keys(this.schema[schema]);
    let id = null;
    let rt = false;
    for(let i = 0; i < keys.length; ++i){
      id = keys[i];
      rt = this.sendData2Part(id, data);
      if (rt === true && sent === false){
        sent = true;
      }
    }
    return sent;
  }
  else{
    logger.error("Could not send to data, because The schema not " +
                 "in manager: " + schema);
    return false;
  }
};

// 给一种 part_type 的器件对端发送数据
// part_type: monitor, inputter, listen_outputter, connect_outputter
PartManager.prototype.sendData2PartType = function(ptType, data){
  if (this.part_type[ptType]){
    let sent = false;
    let keys = Object.keys(this.part_type[ptType]);
    let id = null;
    let rt = false;
    for(let i = 0; i < keys.length; ++i){
      id = keys[i];
      rt = this.sendData2Part(id, data);
      if (rt === true && sent === false){
        sent = true;
      }
    }
    return sent;
  }
  else{
    logger.error("Could not send to data, because The part_type not " +
                 "in manager: " + ptType);
    return false;
  }
};

// 给所有 monitor 器件对端发送数据
PartManager.prototype.sendData2AllMonitor = function(data){
  return this.sendData2PartType('monitor', data);
};

// 给所有 inputter 器件对端发送数据
PartManager.prototype.sendData2AllMonitor = function(data){
  return this.sendData2PartType('inputter', data);
};

// 给所有输出 outputter (xxxx_outputter)器件对端发送数据
PartManager.prototype.sendData2AllOutputter = function(data){
  let sent = false;
  let keys = Object.keys(this.part_type);
  let ptType = null;
  let rt = false;
  for(let i = 0; i < keys.length; ++i){
    ptType = keys[i];
    if (ptType.toString().toLowerCase().indexOf('_outputter') > 0 ){
      rt = this.sendData2PartType(ptType, data);
      if (rt === true && sent === false){
        sent = true;
      }
    }
  }
  return sent;
};

// 给所有器件对端发送数据
PartManager.prototype.sendData2All = function(data){
  let sent = false;
  let keys = Object.keys(this.container);
  let id = null;
  let rt = false;
  for(let i = 0; i < keys.length; ++i){
    id = keys[i];
    rt = this.sendData2Part(id, data);
    if (rt === true && sent === false){
      sent = true;
    }
  }
  return sent;
};

module.exports = new PartManager();
