'use strict';
const fs = require('fs');
const path = require('path');

const logger = require('./utils/logger.js');
const Binder = require('./utils/binder.js');

const Inputter = require('./parts/inputter.js');
const Outputter = require('./parts/outputter.js');
const Monitor = require('./parts/monitor.js');
const dataHandler = require('./processor/data_handler.js');

let XXX = function(bindCfg) {
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
      self.outputter_listen = {};
      self.outputter_connect = {};
      logger.trace(data);
    }
  });
};

XXX.prototype.start = function(callback){
  let self = this;
  self.startListen4Parts('monitor', 'any')
  .then(
    self.startListen4Parts('inputter', 'any')
  //).then(
  //  self.startListen4Parts('outputter_listen')
  //).then(
  //  self.startConnect4OutputConnect()
  ).catch(
    error => {
      logger.error("XXX start failed.........");
      process.exit(1);
    }
  );
};

// any one of parts ok, then OK
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
          else{
            logger.error("Unsurpported start parts mode: " + any_all);
            reject("Unsurpported start parts mode: " + any_all);
          }
        }
        else{
          logger.error(idx + " None ["+partType+"] could be started! " + ok_cnt);
          reject(ptCfgs[idx]);
        }
      }
    };
    recursePromiss(0);
  });
  return promiss;
};

XXX.prototype.startOneListenPart = function(partType, partCfg) {
	let self = this;
  logger.trace(partType + " startOnePart(" + partCfg.schema + 
               "://"+ partCfg.host + ":" + partCfg.port +"/) ");
  let partObj = null;
  switch(partType){
  case 'monitor':
    partObj = new Monitor(partCfg.schema, partCfg.host, partCfg.port, 
                          dataHandler.dataProcess).start();
    break; 
  case 'inputter':
    partObj = new Inputter(partCfg.schema, partCfg.host, partCfg.port, 
                           dataHandler.dataProcess, partCfg.response).start();
    break; 
  case 'outputter_listen':
    break; 
  }
  return partObj;
};

// any one of outputter Connect ok, then start listen OK
XXX.prototype.startConnect4OutputConnect = function( callback ){
  logger.trace("startConnect4OutputConnect(...)");
  let self = this;
  let outputter_con = Object.keys(self.binder.cfg.monitor);

  let promiss = new Promise(function(resolve, reject){
  });
  return promiss;
};

XXX.prototype.startGroupOutputListen = function(schema, outputters, callback){
  //logger.trace("startGroupOutputListen(...) => " + outputters);
	let self = this;
	let one_ok = false;
};

XXX.prototype.startGroupOutputConnect = function(schema, outputters, callback){
  //logger.trace("startGroupOutputConnect(...) => " + outputters);
	let self = this;
	let one_ok = false;
};

module.exports = XXX;
