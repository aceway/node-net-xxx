#!/usr/bin/env node
var colors = require('colors');
var xxx = require('./xxx.js');

//var x = new xxx();
//var x = new xxx('./config/bind.json');
var x = new xxx('./config/bind.json', './config/log4js.json');
x.start(function(error, result){
  var logger = require('./utils/logger.js');
  if ( error ){
    logger.error( JSON.stringify(result).red );
  }
  else{
    logger.info( JSON.stringify(result).green );
  }
});

process.on('uncaughtException', function (error) {
  var logger = require('./utils/logger.js');
  var msg = ' Caught exception: ' + error.stack;
  logger.error(msg.red);
});

