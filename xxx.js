#!/usr/bin/env node
'use strict';
var net = require('net');
//var async = require('async');
var logger = require('./utils/logger.js');

var XXX = function(bindCfg) {
  logger.trace("XXX(" + bindCfg+")");
	this.binder = require(bindCfg);
};

XXX.prototype.start = function( ){
  logger.trace("start( ...)");
	var self = this;
};

XXX.prototype.startListen4Input = function( callback ){
  logger.trace("startListen4Input(...)");
}

XXX.prototype.startListen4OutputHere = function( callback ){
  logger.trace("startListen4OutputHere (...)");
}

XXX.prototype.startConnect4OutputThere = function( callback ){
  logger.trace("startConnect4OutputThere (...)");
}


var xxx = new XXX('./binder.js');
xxx.start();

process.on('uncaughtException', function (err) {
  var colors = require('colors');
  var msg = ' Caught exception: ' + err.stack;
  logger.error(msg.red);
});
