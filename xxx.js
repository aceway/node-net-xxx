'use strict';
var async = require('async');
var logger = require('./utils/logger.js');

var Inputter = require('./parts/inputter.js');
var Outputter = require('./parts/outputter.js');
var Monitor = require('./parts/monitor.js');
var dataHandler = require('./processor/data_handler.js');

var XXX = function(bindCfg) {
  logger.trace("XXX(" + bindCfg+")");
  this.binder = require(bindCfg);
  this.inputter = {};
  this.outputter_listen = {};
  this.outputter_connect = {};
  this.monitor = {};
};

XXX.prototype.start = function(callback){
  var self = this;
  async.series([
    function(cb){
      self.binder.prepareCfg(cb);
    },
    function(cb){
      self.open_inputter_outputter(function(err, res){
        if (!err && res && res.inputter === true && 
            res.outputter === true && res.monitor === true){
          cb(null, res);
        }
        else{
          cb(-1, res);
        }
      });
    }
  ],function(err, res){
    if ( ! err ){
      logger.info("Start this node-net-xxx server OK.");
    }
    else{
    }
    callback(err, res);
  });
};

// inputter, outputter and monitor must be all ok, then OK
XXX.prototype.open_inputter_outputter = function(callback){
  logger.trace("open_inputter_outputter( ...)");
  var self = this;

  async.series({
    inputter: function(cb_outer) {
      self.startListen4Inputter(cb_outer);
    },
    outputter: function(cb_outer){
      async.parallel({
        outputter_listen: function(cb_inner) {
          self.startListen4OutputListen(cb_inner);
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
    },
    monitor: function(cb_outer){
      self.startListen4Monitor(cb_outer);
    }
  }, function(err, results){
    callback(err, results);
  });
};

// any only of inputter ok, then start listen OK
XXX.prototype.startListen4Inputter = function(callback){
  logger.trace("startListen4Inputter(...)");
  var self = this;
  var inputter_ok = false;
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

// any only of monitor ok, then start listen OK
XXX.prototype.startListen4Monitor = function(callback){
  logger.trace("startListen4Monitor(...)");
  var self = this;
  var monitor_ok = false;
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

// any only of outputter listen ok, then start listen OK
XXX.prototype.startListen4OutputListen = function( callback ){
  logger.trace("startListen4OutputListen(...)");
  var self = this;
  var outputter_listen = false;
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

// any only of outputter Connect ok, then start listen OK
XXX.prototype.startConnect4OutputConnect = function( callback ){
  logger.trace("startConnect4OutputConnect(...)");
  var self = this;
  var outputter_connect = false;
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
	var self = this;
	var info = inputter.trim().split(':');
	var response = self.binder.isOutputterSelf(schema);
	var npt = new Inputter(schema, info[0], info[1], response);
	npt.start(dataHandler, function(err, result){
		if ( ! err ){
			self.inputter[inputter.trim()] = npt;
		}
		callback(err, result);
	});
};

XXX.prototype.startOneMonitor = function(schema, monitor, callback) {
  //logger.trace("startOneMonitor(...) => " + monitor);
	var self = this;
	var info = monitor.trim().split(':');
	var mnt = new Monitor(schema, info[0], info[1]);
	mnt.start(dataHandler, function(err, result){
		if ( ! err ){
			self.monitor[monitor.trim()] = mnt;
		}
		callback(err, result);
	});
};

XXX.prototype.startGroupOutputListen = function(schema, outputters, callback){
  //logger.trace("startGroupOutputListen(...) => " + outputters);
	var self = this;
	var one_ok = false;
	async.each( outputters, function(outputter, cb){
		if ( outputter==="self" ) outputter = self.binder.getSelfInputter(schema);
		var info = outputter.trim().split(':');
		var tpt = new Outputter(schema, info[0], info[1], "LISTEN");
		tpt.start(dataHandler, function(e, r){
			if ( ! e ){
				self.outputter_listen[outputter.trim()] = tpt;
				one_ok = true;
			}
			else{
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
	var self = this;
	var one_ok = false;
	async.each( outputters, function(outputter, cb){
		if ( outputter==="self" ) outputter = self.binder.getSelfInputter(schema);
		var info = outputter.trim().split(':');
		var tpt = new Outputter(schema, info[0], info[1], "CONNECT");
		tpt.start(dataHandler, function(e, r){
			if ( ! e ){
				self.outputter_listen[outputter.trim()] = tpt;
				one_ok = true;
			}
			else {
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
