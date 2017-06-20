#!/usr/bin/env node
"use strict";
const logger = require('./utils/logger.js');
const xxx = require('./xxx.js');

logger.create('./config/log4js.json', function(e, r){
  if (e){
    console.error("Logger error, could not start server: " + 
                  e + ( r ? ","+r : ""));
  }
  else{
    let x = new xxx('./config/bind.json');
    x.start(function(error, result){
      if ( error ){
        logger.error(error + JSON.stringify(result));
      }
      else{
        logger.info(JSON.stringify(result));
      }
    });
  }
});

process.on('uncaughtException', function (error) {
  let logger = require('./utils/logger.js');
  logger.error(' Caught exception: ' + error + ',' + error.stack);
});

