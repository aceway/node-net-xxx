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
			callback(null, res);
		}
		else{
			callback(-1, res);
		}
	});
};

// input, output and monitor must be all ok, then OK
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

// any only of input ok, then start listen OK
XXX.prototype.startListen4Input = function(callback){
  logger.trace("startListen4Input(...)");
	var self = this;
	var input_ok = false;
	async.each( Object.keys(self.binder.cfg.input),
	  function(key, cb) {
			self.startOneInput(key, self.binder.cfg.input[key], function(e, r){
				if ( !e ){
					input_ok = true;
				}
				else{
					logger.warn("Listen on input: " + key + " " + r + " failed.");
				}
				cb(null);
			});
		},
	  function(err) {
			if ( input_ok ){
				logger.info("Listen for input OK");
				callback(null, true);
			}
			else{
				logger.info("Listen for input FAILED");
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
				}
				else{
					logger.warn("Listen on monitor: " + key + " " + r + " failed.");
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
				logger.info("Listen for monitor FAILED");
				callback(-1, false);
			}
	});
};

// any only of output here ok, then start listen OK
XXX.prototype.startListen4OutputHere = function( callback ){
  logger.trace("startListen4OutputHere(...)");
	var self = this;
	var output_here = false;
	async.each( Object.keys(self.binder.cfg.output_here),
	  function(key, cb) {
			//logger.debug("OUTPUT here: " + key);
			self.startGroupOutputHere(key, 
																self.binder.cfg.output_here[key], 
																function(e, r){
				if ( ! e ){
					output_here = true;
				}
				else{
					logger.warn("Listen on output_here: " + key + " " + r + " failed.");
				}
				cb(null);
			});
		},
	  function(err, results) {
			if ( output_here ){
				logger.info("Listen for output_here OK");
				callback(null, true);
			}
			else{
				logger.info("Listen for output_here FAILED");
				callback(-1, false);
			}
	});
};

// any only of output There ok, then start listen OK
XXX.prototype.startConnect4OutputThere = function( callback ){
  logger.trace("startConnect4OutputThere(...)");
	var self = this;
	var output_there = false;
	async.each( Object.keys(self.binder.cfg.output_there),
	  function(key, cb) {
			//logger.debug("OUTPUT there: " + key);
			self.startGroupOutputThere(key, 
																self.binder.cfg.output_there[key],
																function(e, r){
				if ( ! e ){
					output_there = true;
				}
				else{
					logger.warn("Connect to output_There: " + key + " " + r + " failed.");
				}
				cb(null);
			});
		},
	  function(err, results) {
			if ( output_there ){
				logger.info("Connect to output_There OK");
				callback(null, true);
			}
			else{
				logger.info("Connect to output_There FAILED");
				callback(-1, false);
			}
	});
};

XXX.prototype.startOneInput = function(schema, input, callback) {
  //logger.trace("startOneInput(...) => " + input);
	var self = this;
	var info = input.trim().split(':');
	var npt = new Inputter(schema, info[0], info[1]);
	npt.start(function(err, result){
		if ( ! err ){
			self.inputter[input.trim()] = npt;
		}
		callback(err, result);
	});
};

XXX.prototype.startOneMonitor = function(schema, monitor, callback) {
  //logger.trace("startOneMonitor(...) => " + monitor);
	var self = this;
	var info = monitor.trim().split(':');
	var mnt = new Monitor(schema, info[0], info[1]);
	mnt.start(function(err, result){
		if ( ! err ){
			self.monitor[monitor.trim()] = mnt;
		}
		callback(err, result);
	});
};

XXX.prototype.startGroupOutputHere = function(schema, outputs, callback) {
  //logger.trace("startGroupOutputHere(...) => " + outputs);
	var self = this;
	var one_ok = false;
	async.each( outputs, function(output, cb){
		if ( output === "self" ) output = self.binder.getSelfInput(schema);
		var info = output.trim().split(':');
		var tpt = new Outputer(schema, info[0], info[1], "LISTEN");
		tpt.start(function(e, r){
			if ( ! e ){
				self.outputer_here[output.trim()] = tpt;
				one_ok = true;
			}
			else{
			}
			cb(null, r);
		});
	}, function(err, result){
		if ( one_ok === true ) {
			callback(null, "Outputer there OK");
		}
		else {
			callback(-1, "Outputer there FAILED");
		}
	});
};

XXX.prototype.startGroupOutputThere = function(schema, outputs, callback) {
  //logger.trace("startGroupOutputThere(...) => " + outputs);
	var self = this;
	var one_ok = false;
	async.each( outputs, function(output, cb){
		if ( output === "self" ) output = self.binder.getSelfInput(schema);
		var info = output.trim().split(':');
		var tpt = new Outputer(schema, info[0], info[1], "CONNECT");
		tpt.start(function(e, r){
			if ( ! e ){
				self.outputer_here[output.trim()] = tpt;
				one_ok = true;
			}
			else {
			}
			cb(null, r);
		});
	}, function(err, result){
		if ( one_ok === true ) {
			callback(null, "Outputer there OK.");
		}
		else {
			callback(-1, "Outputer there FAILED.");
		}
	});
};

module.exports = XXX;
