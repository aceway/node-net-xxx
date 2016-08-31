#!/usr/bin/env node
'use strict';
var net = require('net');
var logger = require('./utils/logger.js');

var App = function() {
    this.binder = require('./binder.js');
};

App.prototype.start = function( ){
    logger.trace("trace ...");    
    logger.debug("debug ...");    
    logger.info("info ...");    
    logger.warn("warn ...");    
    logger.error("error ...");    
    logger.fatal("over ...");    
    logger.trace("end ...");    
};

var app = new App();
app.start();

process.on('uncaughtException', function (err) {
    var colors = require('colors');
    var msg = ' Caught exception: ' + err.stack;
    logger.error(msg.red);
});
