'use strict';
var async = require('async');
var logger = require('./utils/logger.js');

var Inputter = require('./parts/inputter.js');
var Outputer = require('./parts/outputer.js');
var Monitor = require('./parts/monitor.js');

var XXX = function(bindCfg) {
  logger.trace("XXX(" + bindCfg+")");
	this.binder = require(bindCfg);
	this.inputter = {};
	this.outputer_here = {};
	this.outputer_there = {};
	this.monitor = {};
};

XXX.prototype.start = function(callback){
	var self = this;
	self.open_input_output(function(err, res){
		if (!err && res && res.input === true && 
				res.output === true && res.monitor === true){
			callback(err, "START OK");
		}
		else{
			callback(err, "START FAILED");
		}
	});
};

XXX.prototype.open_input_output = function(callback){
  logger.trace("open_input_output( ...)");
	var self = this;

	async.series({
		input: function(cb_outer) {
			self.startListen4Input(cb_outer);
		},
		output: function(cb_outer){
			async.parallel({
				output_here: function(cb_inner) {
					self.startListen4OutputHere(cb_inner);
				},
				output_there: function(cb_inner) {
					self.startConnect4OutputThere(cb_inner);
				}
			}, function(e, r) {
				if (!e && r && (r.outputer_here || r.output_there) ){
					logger.info("Outputs ok: " + JSON.stringify(r) );
					cb_outer(null, true);
				}
				else{
					logger.error("Outputs failed: " + JSON.stringify(r) );
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

XXX.prototype.startListen4Input = function(callback){
  logger.trace("startListen4Input(...)");
	var self = this;
	async.every( Object.keys(self.binder.cfg.input),
	  function(key, cb) {
			//logger.debug("INPUT: " + key);
			self.startOneInput(key, self.binder.cfg.input[key], cb);
		},
	  function(err, results) {
			callback(err, results);
	});
};

XXX.prototype.startListen4Monitor = function(callback){
  logger.trace("startListen4Monitor(...)");
	var self = this;
	async.every( Object.keys(self.binder.cfg.monitor),
	  function(key, cb) {
			//logger.debug("MONITOR: " + key);
			self.startOneMonitor(key, self.binder.cfg.monitor[key], cb);
		},
	  function(err, results) {
			callback(err, results);
	});
};

XXX.prototype.startListen4OutputHere = function( callback ){
  logger.trace("startListen4OutputHere(...)");
	var self = this;
	async.each( Object.keys(self.binder.cfg.output_here),
	  function(key, cb) {
			//logger.debug("OUTPUT here: " + key);
			self.startGroupOutputHere(key, self.binder.cfg.output_here[key],
																cb);
		},
	  function(err, results) {
			callback(err, !!!err);
	});
};

XXX.prototype.startConnect4OutputThere = function( callback ){
  logger.trace("startConnect4OutputThere(...)");
	var self = this;
	async.each( Object.keys(self.binder.cfg.output_there),
	  function(key, cb) {
			//logger.debug("OUTPUT there: " + key);
			self.startGroupOutputThere(key, self.binder.cfg.output_there[key],
																cb);
		},
	  function(err, results) {
			callback(err, !!!err);
	});
};

XXX.prototype.startOneInput = function(schema, input, callback) {
  //logger.trace("startOneInput(...) => " + input);
	var self = this;
	var info = input.split(':');
	var npt = new Inputter(schema, info[0], info[1]);
	npt.start(function(err, result){
		if ( ! err ){
			self.inputter[input] = npt;
		}
		callback(err, result);
	});
};

XXX.prototype.startOneMonitor = function(schema, monitor, callback) {
  //logger.trace("startOneMonitor(...) => " + monitor);
	var self = this;
	var info = monitor.split(':');
	var mnt = new Monitor(schema, info[0], info[1]);
	mnt.start(function(err, result){
		if ( ! err ){
			self.monitor[monitor] = mnt;
		}
		callback(err, result);
	});
};

XXX.prototype.startGroupOutputHere = function(schema, outputs, callback) {
  //logger.trace("startGroupOutputHere(...) => " + outputs);
	var self = this;
	async.every( outputs, function(output, cb){
		if ( output === "self" ) output = self.binder.getSelfInput(schema);
		var info = output.split(':');
		var tpt = new Outputer(schema, info[0], info[1], "LISTEN");
		tpt.start(function(e, r){
			if ( ! e ){
				self.outputer_here[output] = tpt;
			}
			cb(e, r);
		});
	}, function(err, result){
		callback(err, result);
	});
};

XXX.prototype.startGroupOutputThere = function(schema, outputs, callback) {
  //logger.trace("startGroupOutputThere(...) => " + outputs);
	var self = this;
	var self = this;
	async.every( outputs, function(output, cb){
		if ( output === "self" ) output = self.binder.getSelfInput(schema);
		var info = output.split(':');
		var tpt = new Outputer(schema, info[0], info[1], "CONNECT");
		tpt.start(function(e, r){
			if ( ! e ){
				self.outputer_here[output] = tpt;
			}
			cb(e, r);
		});
	}, function(err, result){
		callback(err, result);
	});
};

module.exports = XXX;
