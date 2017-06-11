'use strict';
var fs = require("fs");
var path = require('path');
//var colors = require('colors');
var log4js = require('log4js');

Date.prototype.format = function(fmt){
  if (typeof fmt !== 'string'  || fmt.length < 2) {
    fmt = "yyyy-MM-dd hh:mm:ss";
  }
  let o = {
    "M+" : this.getMonth()+1, //month
    "d+" : this.getDate(), //day
    "h+" : this.getHours(), //hour
    "m+" : this.getMinutes(), //minute
    "s+" : this.getSeconds(), //second
    "q+" : Math.floor((this.getMonth()+3)/3), //quarter
    "S" : this.getMilliseconds() //millisecond
  };
  if(/(y+)/.test(fmt)) 
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - 
                    RegExp.$1.length));
  for(let k in o)
    if(new RegExp("("+ k +")").test(fmt))
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length===1 ? 
                        o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
  return fmt;
};
let Logger = {
  option:{}, 
  pid: process.pid,
  log_dir:"", 
  escape_trace: false,
  escape_debug: false,
  escape_info:  false,
  escape_warn:  false,
  escape_error: false,
  escape_fatal: false
};

Logger.create = function(logCfg, callback) {
  if ( typeof logCfg === 'string' && logCfg.length > 0){
    if ( ! path.isAbsolute(logCfg) ){
      logCfg = path.join(process.cwd(), logCfg);
    }
  }
  else{
    logCfg = path.join(process.cwd(), "./config/log4js.json");                     
  }
  try{
    fs.accessSync(logCfg, fs.R_OK);                                                
  }
  catch(e){
    let tip = "Access log4js config failed: " + e;
    console.error(tip);
    //process.exit(1);
    return callback(-1, tip);
  }
  let self = this;
  console.info("[pid:"+self.pid+"]"+"Going to start server with log config: " + logCfg);
  self._prepare(function(error, result){
    self.option = require(logCfg);
    self.init(function(err, res){
      callback(err, res);
    });
  });
};

Logger._prepare = function(callback) {
  let self = Logger;
  try{
    let dir = new Date().format("yyyy-MM-dd");
    if (dir === self.log_dir){
      return callback(null, "Logger._prepare OK");
    }

    let fullPath = process.cwd() + "/logs/";
    if( !fs.existsSync(fullPath) ){
      //console.log("Make the new dir:".red + fullPath);
      fs.mkdirSync(fullPath);
      fullPath = process.cwd() + "/logs/" + dir;
      if( !fs.existsSync(fullPath) ){
        //console.log("Make the new dir:".red + fullPath);
        fs.mkdirSync(fullPath);
      }
      else{
        //console.log("The dir has exist:".green + fullPath);
      }
      self.log_dir = dir;
    }
    else{
      //console.log("The dir has exist:".green + fullPath);
      fullPath = process.cwd() + "/logs/" + dir;
      if( !fs.existsSync(fullPath) ){
        //console.log("Make the new dir:".red + fullPath);
        fs.mkdirSync(fullPath);
      }
      else{
        //console.log("The dir has exist:".green + fullPath);
      }
      self.log_dir = dir;
    }
  }
  catch(e){
    console.warn("Logger._prepare throw exception:" + e);
  }
  callback(null, "Logger._prepare OK. new date dir.");
};

Logger.init = function (callback) {
  let self = Logger;
  log4js.configure(self.option);

  

  // 终端调试输出
  self.logConsole = log4js.getLogger('console');

  // 所有到文件的日志汇总在一个文件里，便于调试
  if ( self.option.allInOne === true ){
    self.logAll_ = log4js.getLogger('logAll');
  }

  // 处理流程节点跟踪日志，比如收发协议记录
  self.logTrace = log4js.getLogger('logTrace');

  // 开发调试日志
  self.logDebug = log4js.getLogger('logDebug');

  // 逻辑处理流程的关键数据，但又不需要记录到数据库的信息
  self.logInfo = log4js.getLogger('logInfo');

  // 属于逻辑不严密的错误，但不用终止当前操作，输出warn信息
  self.logWarn = log4js.getLogger('logWarn');

  // 逻辑功能错误信息，比如处理到非预期数据，输出错误信息后终止处理流程
  self.logError = log4js.getLogger('logError');

  // 非逻辑层错误信息，输出log后需要终止进程
  self.logFatal = log4js.getLogger('logFatal');

  if (log4js.levels && log4js.levels.config && 
      typeof log4js.levels.getLevel === 'function'){
    let cfg = log4js.levels.config['[all]'];
    let lvl = log4js.levels.getLevel(cfg).level;
    //console.error(lvl);
    //console.error(log4js.levels.getLevel("ALL").level);
    //console.error(log4js.levels.getLevel("TRACE").level);
    //console.error(log4js.levels.getLevel("DEBUG").level);
    //console.error(log4js.levels.getLevel("INFO").level);
    //console.error(log4js.levels.getLevel("WARN").level);
    //console.error(log4js.levels.getLevel("ERROR").level);
    //console.error(log4js.levels.getLevel("FATAL").level);
    if (cfg && lvl){
      console.info("Got cfg logger level: " + cfg + " - " + lvl);
      if ( lvl === log4js.levels.getLevel("ALL").level){
        self.escape_trace = false;
        self.escape_debug = false;
        self.escape_info  = false;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
      }
      else if ( lvl >= log4js.levels.getLevel("TRACE").level){
        self.escape_trace = false;
        self.escape_debug = false;
        self.escape_info  = false;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
      }
      else if ( lvl >= log4js.levels.getLevel("DEBUG").level){
        self.escape_trace = true;
        self.escape_debug = false;
        self.escape_info  = false;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
      }
      else if ( lvl >= log4js.levels.getLevel("INFO").level){
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = false;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
      }
      else if ( lvl >= log4js.levels.getLevel("WARN").level){
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = true;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
      }
      else if ( lvl >= log4js.levels.getLevel("ERROR").level){
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = true;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
      }
      else{
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = true;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
      }
    }
  }
  else if (self.option && self.option.levels && self.option.levels["[all]"]){
    let lvl = self.option.levels["[all]"];
    console.info("Got cfg logger level: " + lvl );
    switch (lvl){
      case "ALL":
        self.escape_trace = false;
        self.escape_debug = false;
        self.escape_info  = false;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
        break;
      case "TRACE":
        self.escape_trace = true;
        self.escape_debug = false;
        self.escape_info  = false;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
        break;
      case "DEBUG":
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = false;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
        break;
      case "INFO":
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = true;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
        break;
      case "WARN":
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = true;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
        break;
      case "FATAL":
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = true;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
        break;
      default:
        self.escape_trace = true;
        self.escape_debug = true;
        self.escape_info  = false;
        self.escape_warn  = false;
        self.escape_error = false;
        self.escape_fatal = false;
        break;
    }
  }
  else{
    console.info("Use default logger level: " + lvl );
    self.escape_trace = true;
    self.escape_debug = true;
    self.escape_info  = false;
    self.escape_warn  = false;
    self.escape_error = false;
    self.escape_fatal = false;
  }

  callback(null, "Logger.init OK");
};

Logger.console = function (msg) {
  let self = Logger;
  self._prepare(function(){
    msg = "[pid:"+self.pid+"]" + msg;
    if (typeof self.logConsole === 'undefined') {
      console.log(msg);
    }
    else{
      self.logConsole.trace(msg);
    }
  });
};

Logger.trace = function (msg) {
  let self = Logger;
  if (self.escape_trace) return;

  self._prepare(function(){
    self.logConsole.trace(msg);
    if (self.logAll_ && self.logAll_.trace) self.logAll_.trace(msg);

    if (typeof self.logTrace === 'undefined') {
      console.log(msg);
    }
    else{
      self.logTrace.trace(msg);
    }
  });
};

Logger.debug = function (msg) {
  let self = Logger;
  if (self.escape_debug) return;

  self._prepare(function(){
    self.logConsole.debug(msg);
    if (self.logAll_ && self.logAll_.debug) self.logAll_.debug(msg);

    if (typeof self.logDebug === 'undefined') {
      console.log(msg);
    }
    else{
      self.logDebug.debug(msg);
    }
  });
};

Logger.info = function (msg) {
  let self = Logger;
  if (self.escape_info) return;

  self._prepare(function(){
    self.logConsole.info(msg);
    if (self.logAll_ && self.logAll_.info) self.logAll_.info(msg);

    if (typeof self.logInfo === 'undefined') {
      console.info(msg);
    }
    else{
      self.logInfo.info(msg);
    }
  });
};

Logger.warn = function (msg) {
  let self = Logger;
  if (self.escape_warn) return;

  self._prepare(function(){
    self.logConsole.warn(msg);
    if (self.logAll_ && self.logAll_.warn) self.logAll_.warn(msg);

    if (typeof self.logWarn === 'undefined') {
      console.warn(msg);
    }
    else{
      self.logWarn.warn(msg);
    }
  });
};

Logger.error = function (msg) {
  let self = Logger;
  if (self.escape_error) return;

  self._prepare(function(){
    self.logConsole.error("[pid:"+self.pid+"]"+msg);
    if (self.logAll_ && self.logAll_.error) self.logAll_.error("[pid:"+self.pid+"]"+msg);

    if (typeof self.logError === 'undefined') {
      console.error("[pid:"+self.pid+"]"+msg);
    }
    else{
      self.logError.error("[pid:"+self.pid+"]"+msg);
    }
  });
};

Logger.fatal = function (msg) {
  let self = Logger;
  if (self.escape_fatal) return;

  self._prepare(function(){
    self.logConsole.fatal("[pid:"+self.pid+"]"+msg);
    if (self.logAll_ && self.logAll_.fatal) self.logAll_.fatal("[pid:"+self.pid+"]"+msg);

    if (typeof self.logFatal === 'undefined') {
      console.error("[pid:"+self.pid+"]"+msg);
    }
    else{
      self.logFatal.fatal("[pid:"+self.pid+"]"+msg);
    }
    log4js.shutdown(function() { process.exit(-1); });
  });
};

module.exports = Logger;
