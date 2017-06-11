#!/usr/bin/env node
"use strict";
const logger = require('./utils/logger.js');
const xxx = require('./xxx.js');

logger.create('./config/log4js.json', function(e, r){
  if (e){
    console.error("Logger error, could not start server: " + e + "," + r);
  }
  else{
    //let x = new xxx();
    //let x = new xxx('./config/bind.json');
    let x = new xxx('./config/bind.json');
    x.start(function(error, result){
      if ( error ){
        logger.error( JSON.stringify(result).red );
      }
      else{
        logger.info( JSON.stringify(result).green );
      }
    });
  }
});

process.on('uncaughtException', function (error) {
  let logger = require('./utils/logger.js');
  let msg = ' Caught exception: ' + error.stack;
  logger.error(msg.red);
});

