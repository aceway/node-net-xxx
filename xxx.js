'use strict';
var async = require('async');
var logger = require('./utils/logger.js');

var inputer = require('./parts/inputer.js');
var outputer = require('./parts/outputer.js');
var monitor = require('./parts/monitor.js');

var XXX = function(bindCfg) {
  logger.trace("XXX(" + bindCfg+")");
	this.binder = require(bindCfg);
	this.inputer = {};
	this.outputer_here = {};
	this.outputer_there = {};
};

XXX.prototype.start = function(callback){
	var self = this;
	self.open_input_output(callback);
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
			logger.debug("INPUT: " + key);
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
			logger.debug("MONITOR: " + key);
			self.startOneMonitor(key, self.binder.cfg.monitor[key], cb);
		},
	  function(err, results) {
			callback(err, results);
	});
};

XXX.prototype.startListen4OutputHere = function( callback ){
  logger.trace("startListen4OutputHere(...)");
	var self = this;
	async.every( Object.keys(self.binder.cfg.output_here),
	  function(key, cb) {
			logger.debug("OUTPUT here: " + key);
			self.startGroupOutputHere(key, self.binder.cfg.output_here[key],
																cb);
		},
	  function(err, results) {
			callback(err, results);
	});
};

XXX.prototype.startConnect4OutputThere = function( callback ){
  logger.trace("startConnect4OutputThere(...)");
	var self = this;
	async.every( Object.keys(self.binder.cfg.output_there),
	  function(key, cb) {
			logger.debug("OUTPUT there: " + key);
			self.startGroupOutputThere(key, self.binder.cfg.output_there[key],
																cb);
		},
	  function(err, results) {
			callback(err, results);
	});
};

XXX.prototype.startOneInput = function(schema, input, callback) {
  logger.trace("startOneInput(...) => " + input);
	var self = this;
	callback(null, true);
};

XXX.prototype.startOneMonitor = function(schema, monitor, callback) {
  logger.trace("startOneMonitor(...) => " + monitor);
	var self = this;
	callback(null, true);
};

XXX.prototype.startGroupOutputHere = function(schema, outputs, callback) {
  logger.trace("startGroupOutputHere(...) => " + outputs);
	var self = this;
	callback(null, true);
};

XXX.prototype.startGroupOutputThere = function(schema, outputs, callback) {
  logger.trace("startGroupOutputThere(...) => " + outputs);
	var self = this;
	callback(null, true);
};

module.exports = XXX;
