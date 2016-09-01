'use strict';
var logger = require('./utils/logger.js');
var async = require('async');

var XXX = function(bindCfg) {
  logger.trace("XXX(" + bindCfg+")");
	this.binder = require(bindCfg);
	this.inputer = {};
	this.outputer_here = {};
	this.outputer_there = {};
};

XXX.prototype.start = function(callback){
  logger.trace("start( ...)");
	var self = this;
	async.parallel({
		input: function(cb) {
			self.startListen4Input(cb);
		},
		output_here: function(cb) {
			self.startListen4OutputHere(cb);
		},
		output_there: function(cb) {
			self.startConnect4OutputThere(cb);
		}
	}, function(err, results) {
		callback(err, results);
	});
};

XXX.prototype.startListen4Input = function(callback){
  logger.trace("startListen4Input(...)");
	var self = this;
	async.every( Object.keys(self.binder.input),
	  function(key, cb) {
			logger.debug("INPUT: " + key);
			self.startOneInput(key, self.binder.input[key], cb);
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

XXX.prototype.startListen4OutputHere = function( callback ){
  logger.trace("startListen4OutputHere(...)");
	var self = this;
	async.every( Object.keys(self.binder.output_here),
	  function(key, cb) {
			logger.debug("OUTPUT here: " + key);
			self.startGroupOutputHere(key, self.binder.output_here[key],
																cb);
		},
	  function(err, results) {
			callback(err, results);
	});
};

XXX.prototype.startGroupOutputHere = function(schema, outputs, callback) {
  logger.trace("startGroupOutputHere(...) => " + outputs);
	var self = this;
	callback(null, true);
};

XXX.prototype.startConnect4OutputThere = function( callback ){
  logger.trace("startConnect4OutputThere(...)");
	var self = this;
	async.every( Object.keys(self.binder.output_there),
	  function(key, cb) {
			logger.debug("OUTPUT there: " + key);
			self.startGroupOutputThere(key, self.binder.output_there[key],
																cb);
		},
	  function(err, results) {
			callback(err, results);
	});
};

XXX.prototype.startGroupOutputThere = function(schema, outputs, callback) {
  logger.trace("startGroupOutputThere(...) => " + outputs);
	var self = this;
	callback(null, true);
};

module.exports = XXX;
