'use strict';
const fs = require('fs');
const path = require('path');

const logger = require('./utils/logger.js');
const Binder = require('./utils/binder.js');

const PartBase = require('./parts/partBase.js');
const Inputter = require('./parts/inputter.js');
const Monitor = require('./parts/monitor.js');
const ListenOutputter= require('./parts/listenOutputter.js');
const ConnectOutputter= require('./parts/connectOutputter.js');

const partMgr = require('./parts/partManager.js');

const dataHandler = require('./processor/dataHandler.js');

class XXX {
  constructor(bindCfg) {
    let self = this;
	  if ( typeof bindCfg === 'string' && bindCfg.length > 0){
	  	if ( ! path.isAbsolute(bindCfg) ){
	  		bindCfg = path.join(process.cwd(), bindCfg);
	  	}
	  }
	  else{
        logger.warn("The bind config is wrong: " + bindCfg);
        process.exit(1);
	  }
	  try{
	  	fs.accessSync(bindCfg, fs.R_OK);
	  }
	  catch(e){
	  	logger.error("Access bind config failed: " + e);
	  	process.exit(1);
	  }
    let binder = new Binder(bindCfg);
    binder.prepareCfg(function(error, data){
      if (error){
	  	  logger.error("The configed bind content error: " + data);
	  	  process.exit(1);
      }
      else{
        self.binder = binder;
        self.monitor = {};
        self.inputter = {};
        self.listen_outputter = {};
        self.outputter_connect = {};
        logger.trace(data);
      }
    });
  }
}

// 启动配置中的各种部件: monitor -> inputter -> outputter
// monitor 和 inputter 都时监听类型,且必须各至少有一个启动成功,否则程序退出
// outputter 启动只是尝试,失败与否不影响本服务程序的启动
XXX.prototype.start = function(){
  let self = this;
  self.startListen4Parts('monitor', 'any')
  .then(
    self.startListen4Parts('inputter', 'any')
  ).then(
    self.startListen4Parts('listen_outputter', 'none')
  ).then(
    self.startConnect4Parts('connect_outputter', 'none')
  ).catch(
    error => {
      logger.error("XXX start failed: " + error);
      process.exit(1);
    }
  );
};

// 启动监听类型的部件
// partType: 部件类型, 对应于 config/bind.js 中的key
// any_all: 取值 any, all, none, 本函数调用内部分结果对最终的控制
//         any 只要一个部件成功,函数调用结果算成功-Promise.resolve
//         all 全部部件成功,函数调用结果才算成功-Promise.resolve
//         none 无需部件成功,函数调用结果都算成功-总是Promis.resolve
XXX.prototype.startListen4Parts = function(partType, any_all){
  let self = this;
  logger.trace("startListen4Parts(" + partType + ", " + any_all + ")");
  let promiss = new Promise((resolve, reject) => {
    let ok_cnt = 0;
    let ptCfgs = self.binder.cfg[partType];
    let recursePromiss = function(idx){
      if (0 <= idx && idx < ptCfgs.length ){
        let ptCfg = ptCfgs[idx];
        self.startOneListenPart(partType, ptCfg)
            .then(p => { 
              ++ok_cnt; 
              recursePromiss(++idx); 
            })
            .catch(e =>{ 
              logger.warn("startOneListenPart ["+partType+"] " +
                          JSON.stringify(ptCfg) + " error:" + e);
              recursePromiss(++idx); 
            });
      }
      else{
        if ( ok_cnt > 0 ){
          if (any_all.toLowerCase().trim() === 'all'){
            if (ok_cnt === ptCfgs){
              logger.info("All ["+partType+"] OK: " + ok_cnt);
              resolve("OK");
            }
            else{
              logger.error("Need all [" + partType + 
                           "] but at least one could not be started!");
              reject(ptCfgs[idx]);
            }
          }
          else if (any_all.toLowerCase().trim() === 'any'){
            logger.info("Start at least one ["+partType+"] OK: " + ok_cnt);
            resolve("OK");
          }
          else if (any_all.toLowerCase().trim() === 'none'){
            resolve("OK");
          }
          else{
            logger.error("Unsurpported start parts mode: " + any_all);
            reject("Unsurpported start parts mode: " + any_all);
          }
        }
        else{
          if (any_all.toLowerCase().trim() === 'none'){
            resolve("OK");
          }
          else{
            logger.error(idx + " None ["+partType+"] could be started! " + ok_cnt);
            reject(ptCfgs[idx]);
          }
        }
      }
    };
    recursePromiss(0);
  });
  return promiss;
};

// 启动主动去连接类型的部件
XXX.prototype.startConnect4Parts = function(partType, any_all){
  let self = this;
  logger.trace("startConnect4Parts(" + partType + ", " + any_all + ")");
  let promiss = new Promise((resolve, reject) => {
    let ok_cnt = 0;
    let ptCfgs = self.binder.cfg[partType];
    let recursePromiss = function(idx){
      if (0 <= idx && idx < ptCfgs.length ){
        let ptCfg = ptCfgs[idx];
        self.startOneConnectPart(partType, ptCfg)
            .then(p => { 
              ++ok_cnt; 
              recursePromiss(++idx); 
            })
            .catch(e =>{ 
              logger.warn("startOneConnectPart ["+partType+"] " +
                          JSON.stringify(ptCfg) + " error:" + e);
              recursePromiss(++idx); 
            });
      }
      else{
        if ( ok_cnt > 0 ){
          if (any_all.toLowerCase().trim() === 'all'){
            if (ok_cnt === ptCfgs){
              logger.info("All ["+partType+"] OK: " + ok_cnt);
              resolve("OK");
            }
            else{
              logger.error("Need all [" + partType + 
                           "] but at least one could not be started!");
              reject(ptCfgs[idx]);
            }
          }
          else if (any_all.toLowerCase().trim() === 'any'){
            logger.info("Start at least one ["+partType+"] OK: " + ok_cnt);
            resolve("OK");
          }
          else if (any_all.toLowerCase().trim() === 'none'){
            resolve("OK");
          }
          else{
            logger.error("Unsurpported start parts mode: " + any_all);
            reject("Unsurpported start parts mode: " + any_all);
          }
        }
        else{
          if (any_all.toLowerCase().trim() === 'none'){
            resolve("OK");
          }
          else{
            logger.error(idx + " None ["+partType+"] could be started! " + ok_cnt);
            reject(ptCfgs[idx]);
          }
        }
      }
    };
    recursePromiss(0);
  });
  return promiss;
};

// 启动一个监听部件
XXX.prototype.startOneListenPart = function(partType, partCfg) {
	let self = this;
  logger.trace(partType + " startOneListenPart(" + partCfg.schema + 
               "://"+ partCfg.host + ":" + partCfg.port +"/) ");
  let partObj = null;
  switch(partType){
  case 'monitor':
    partObj = new Monitor(partCfg.schema, partCfg.host, partCfg.port, 
                          dataHandler.dataProcess);
    if (!partMgr.hasPartObj(partObj)){
      partMgr.addOnePart(partObj);
    } 
    else{
      partObj = partMgr.getPartOneId(partObj.id);
    }
    break; 
  case 'inputter':
    partObj = new Inputter(partCfg.schema, partCfg.host, partCfg.port, 
                           dataHandler.dataProcess, partCfg.response);
    if (!partMgr.hasPartObj(partObj)){
      partMgr.addOnePart(partObj);
    } 
    else{
      partObj = partMgr.getPartOneId(partObj.id);
    }
    break; 
  case 'listen_outputter':
    partObj = new ListenOutputter(partCfg.schema, partCfg.host, partCfg.port, 
                           dataHandler.dataProcess, partCfg.response);
    if (!partMgr.hasPartObj(partObj)){
      partMgr.addOnePart(partObj);
    } 
    else{
      partObj = partMgr.getPartOneId(partObj.id);
    }
    break; 
  default:
    logger.error("In startOneListenPart() found unsurpported partType: " + 
                  partType);
    break; 
  }
  let promiss = null;
  if (partObj instanceof PartBase){
    promiss = partObj.start();
  }
  else{
    promiss = new Promise((resolve, reject) => {
      reject("Unsurpported partType: " + partType);
    });
  }
  return promiss;
};

// 启动一个主动连接部件
XXX.prototype.startOneConnectPart = function(partType, partCfg) {
	let self = this;
  logger.trace(partType + " startOneConnectPart(" + partCfg.schema + 
               "://"+ partCfg.host + ":" + partCfg.port +"/) ");
  let partObj = null;
  switch(partType){
  case 'connect_outputter':
    partObj = new ConnectOutputter(partCfg.schema, partCfg.host, partCfg.port, 
                           dataHandler.dataProcess, partCfg.response);
    if (!partMgr.hasPartObj(partObj)){
      partMgr.addOnePart(partObj);
    } 
    else{
      partObj = partMgr.getPartOneId(partObj.id);
    }
    break; 
  default:
    logger.error("In startOneConnectPart() found unsurpported partType: " + 
                  partType);
    break; 
  }
  let promiss = null;
  if (partObj instanceof PartBase){
    promiss = partObj.connect();
  }
  else{
    promiss = new Promise((resolve, reject) => {
      reject("Unsurpported partType: " + partType);
    });
  }
  return promiss;
};

module.exports = XXX;
