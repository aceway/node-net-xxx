'user strict'
var logger = require('./utils/logger.js');

Binder = function(cfgJson){
    logger.trace(cfgJson);
    this.bindCfg = require(cfgJson);
};

var binder = new Binder('./config/bind.json');
module.exports = binder;


