#!/usr/bin/env node
var colors = require('colors');
var logger = require('./utils/logger.js');
var xxx = require('./xxx.js');

var x = new xxx('./config/bind.json');
x.start(function(e, r){
  if ( e ){
    logger.error( JSON.stringify(r).red );
  }
  else{
    logger.info( JSON.stringify(r).green );
  }
});

process.on('uncaughtException', function (err) {
  var msg = ' Caught exception: ' + err.stack;
  logger.error(msg.red);
});

