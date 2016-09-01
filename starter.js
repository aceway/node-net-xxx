#!/usr/bin/env node
var logger = require('./utils/logger.js');
var xxx = require('./xxx.js');

var x = new xxx('./utils/binder.js');
x.start(function(e, r){
	logger.trace(r);
});

process.on('uncaughtException', function (err) {
  var colors = require('colors');
  var msg = ' Caught exception: ' + err.stack;
  logger.error(msg.red);
});

