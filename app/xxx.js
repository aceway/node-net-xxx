'use strict';
const fs = require('fs');
const path = require('path');
const async = require('async');

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
      setTimeout(function(){
        process.exit(1);
      });
	}
	try{
		fs.accessSync(bindCfg, fs.R_OK);
	}
	catch(e){
		logger.error("Access bind config failed: " + e);
    setTimeout(function(){
		  process.exit(1);
    });
	}
  let binder = new Binder(bindCfg);
  binder.prepareCfg(function(error, data){
    if (error){
		  logger.error("The configed bind content error: " + error);
      setTimeout(function(){
		    process.exit(1);
      });
    }
    else{
      logger.trace(data);
      self.monitor = {};
      self.binder = binder;
      self.inputter = {};
      self.outputter_listen = {};
      self.outputter_connect = {};
    }
  });
};

XXX.prototype.start = function(callback){
  let self = this;

  async.series({
    monitor: function(cb_outer){
			// any one of monitor ok, then start listen OK
      self.startListen4Monitors(cb_outer);
    },
    inputter: function(cb_outer) {
			// any one of inputter ok, then start listen OK
      self.startListen4Inputter(cb_outer);
    },
    outputter: function(cb_outer){
      async.parallel({
        outputter_listen: function(cb_inner) {
          self.startListen4Output(cb_inner);
        },
        outputter_connect: function(cb_inner) {
          self.startConnect4OutputConnect(cb_inner);
        }
      }, function(e, r) {
        if (!e && r && (r.outputter_listen || r.outputter_connect) ){
          logger.info("Outputters ok: " + JSON.stringify(r) );
          cb_outer(null, true);
        }
        else{
          logger.error("Outputters failed: " + JSON.stringify(r) );
          cb_outer(-1, r);
          //cb_outer(-1, false);
        }
      });
    }
  }, function(err, results){
    callback(err, results);
  });
};

// any one of monitor ok, then OK
XXX.prototype.startListen4Monitors = function(callback){
  logger.trace("startListen4Monitors(...)");
  let self = this;
  let monCfgs = Object.keys(self.binder.cfg.monitor);


  let monitor_ok = false;
  async.each( Object.keys(self.binder.cfg.monitor),
    function(key, cb) {
      self.startOneMonitor(key, self.binder.cfg.monitor[key], function(e, r){
        if ( ! e ){
          monitor_ok = true;
          logger.info("Monitor listen on: " + key + " " + r + " OK.");
        }
        else{
          logger.warn("Monitor listen on: " + key + " " + r + " failed.");
        }
        cb(null);
      });
    },
    function(err) {
      if ( monitor_ok ){
        logger.info("Listen for monitor OK");
        callback(null, true);
      }
      else{
        logger.error("Listen for monitor FAILED");
        callback(-1, false);
      }
  });
};

// any one of inputter ok, then start listen OK
XXX.prototype.startListen4Inputter = function(callback){
  logger.trace("startListen4Inputter(...)");
  let self = this;
  let inputter_ok = false;
  async.each( Object.keys(self.binder.cfg.inputter),
    function(key, cb) {
      self.startOneInputter(key, self.binder.cfg.inputter[key], function(e, r){
        if ( !e ){
          inputter_ok = true;
          logger.info("Inputter listen on: " + key + " " + r + " OK.");
        }
        else{
          logger.warn("Inputter listen on: " + key + " " + r + " failed.");
        }
        cb(null);
      });
    },
    function(err) {
      if ( inputter_ok ){
        logger.info("Listen for inputter OK");
        callback(null, true);
      }
      else{
        logger.error("Listen for inputter FAILED");
        callback(-1, false);
      }
  });
};

// any one of outputter listen ok, then start listen OK
XXX.prototype.startListen4Output= function( callback ){
  logger.trace("startListen4Output(...)");
  let self = this;
  let outputter_listen = false;
  async.each( Object.keys(self.binder.cfg.outputter_listen),
    function(key, cb) {
      //logger.debug("OUTPUT listen: " + key);
      self.startGroupOutputListen(key, 
                                self.binder.cfg.outputter_listen[key], 
                                function(e, r){
        if ( ! e ){
          outputter_listen = true;
          logger.info("Outputter_listen listen on : " + key + " " + r + " OK.");
        }
        else{
          logger.warn("Outputter_listen listen on: " + key + " " + 
                        r + " failed.");
        }
        cb(null);
      });
    },
    function(err, results) {
      if ( outputter_listen ){
        logger.info("Listen for outputter_listen OK");
        callback(null, true);
      }
      else{
        logger.warn("Listen for outputter_listen FAILED");
        callback(-1, false);
      }
  });
};

// any one of outputter Connect ok, then start listen OK
XXX.prototype.startConnect4OutputConnect = function( callback ){
  logger.trace("startConnect4OutputConnect(...)");
  let self = this;
  let outputter_connect = false;
  async.each( Object.keys(self.binder.cfg.outputter_connect),
    function(key, cb) {
      //logger.debug("OUTPUT connect: " + key);
      self.startGroupOutputConnect(key, 
                                self.binder.cfg.outputter_connect[key],
                                function(e, r){
        if ( ! e ){
          outputter_connect = true;
          logger.info("Outputter_Connect connect to: " + key + " " + 
                        r + " OK.");
        }
        else{
          logger.warn("Outputter_Connect connect to: " + key + " " +
                        r + " failed.");
        }
        cb(null);
      });
    },
    function(err, results) {
      if ( outputter_connect ){
        logger.info("Connect to outputter_Connect OK");
        callback(null, true);
      }
      else{
        logger.warn("Connect to outputter_Connect FAILED");
        callback(-1, false);
      }
  });
};

XXX.prototype.startOneInputter = function(schema, inputter, callback) {
  //logger.trace("startOneInputter(...) => " + inputter);
	let self = this;
	let info = inputter.trim().split(':');
	let response = true;
	let npt = new Inputter(schema, info[0], info[1], response);
	npt.start(dataHandler, function(err, result){
		if ( ! err ){
			self.inputter[inputter.trim()] = npt;
		}
		callback(err, result);
	});
};

XXX.prototype.startOneMonitor = function(schema, monitor, callback) {
  //logger.trace("startOneMonitor(...) => " + monitor);
	let self = this;
	let info = monitor.trim().split(':');
	let mnt = new Monitor(schema, info[0], info[1]);
	mnt.start(dataHandler, function(err, result){
		if ( ! err ){
			self.monitor[monitor.trim()] = mnt;
		}
		callback(err, result);
	});
};

XXX.prototype.startGroupOutputListen = function(schema, outputters, callback){
  //logger.trace("startGroupOutputListen(...) => " + outputters);
	let self = this;
	let one_ok = false;
	async.each( outputters, function(outputter, cb){
		if ( outputter==="self" ) {
      outputter = self.binder.getSelfInputter(schema);
    }
		let info = outputter.trim().split(':');
		let tpt = new Outputter(schema, info[0], info[1], "LISTEN");
		tpt.start(dataHandler, function(e, r){
			if ( ! e ){
				self.outputter_listen[outputter.trim()] = tpt;
				one_ok = true;
			}
			cb(null, r);
		});
	}, function(err, result){
		if ( one_ok === true ) {
			callback(null, "Outputter connect OK");
		}
		else {
			callback(-1, "Outputter connect FAILED");
		}
	});
};

XXX.prototype.startGroupOutputConnect = function(schema, outputters, callback){
  //logger.trace("startGroupOutputConnect(...) => " + outputters);
	let self = this;
	let one_ok = false;
	async.each( outputters, function(outputter, cb){
		if ( outputter==="self" ) {
      outputter = self.binder.getSelfInputter(schema);
    }
		let info = outputter.trim().split(':');
		let tpt = new Outputter(schema, info[0], info[1], "CONNECT");
		tpt.start(dataHandler, function(e, r){
			if ( ! e ){
				self.outputter_listen[outputter.trim()] = tpt;
				one_ok = true;
			}
			cb(null, r);
		});
	}, function(err, result){
		if ( one_ok === true ) {
			callback(null, "Outputter connect OK.");
		}
		else {
			callback(-1, "Outputter connect FAILED.");
		}
	});
};

module.exports = XXX;
