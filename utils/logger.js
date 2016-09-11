'use strict';
var fs = require("fs");
var colors = require('colors');
var log4js = require('log4js');

Date.prototype.format = function(fmt){
	if (typeof fmt !== 'string'  || fmt.length < 2) {
		fmt = "yyyy-MM-dd hh:mm:ss";
	}
  var o = {
  	"M+" : this.getMonth()+1, //month
    "d+" : this.getDate(), //day
    "h+" : this.getHours(), //hour
    "m+" : this.getMinutes(), //minute
    "s+" : this.getSeconds(), //second
    "q+" : Math.floor((this.getMonth()+3)/3), //quarter
    "S" : this.getMilliseconds() //millisecond
  }
  if(/(y+)/.test(fmt)) 
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - 
										RegExp.$1.length));
  for(var k in o)
    if(new RegExp("("+ k +")").test(fmt))
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length==1 ? 
											  o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
  return fmt;
}
var Logger = {};

Logger.create = function(optionsConfig) {
	this.prepare_();
	this.option = require(optionsConfig);
	this.init();
};

Logger.prepare_ = function() {
	var tmObj = new Date();
  var dirPath = process.cwd() + "/logs/";
  if( !fs.existsSync(dirPath) ){
		// log4js 里配置的 pattern 和 filename 是否需要动态调整 ? 待测
		//console.log("Make the new dir:".red + dirPath);
    fs.mkdirSync(dirPath);
  	dirPath = process.cwd() + "/logs/" + tmObj.format("yyyy-MM-dd");
  	if( !fs.existsSync(dirPath) ){
			//console.log("Make the new dir:".red + dirPath);
  	  fs.mkdirSync(dirPath);
  	}
		else{
			//console.log("The dir has exist:".green + dirPath);
		}
  }
	else{
		//console.log("The dir has exist:".green + dirPath);
  	dirPath = process.cwd() + "/logs/" + tmObj.format("yyyy-MM-dd");
  	if( !fs.existsSync(dirPath) ){
			//console.log("Make the new dir:".red + dirPath);
  	  fs.mkdirSync(dirPath);
  	}
		else{
			//console.log("The dir has exist:".green + dirPath);
		}
	}
}

Logger.init = function () {
	var self = Logger;
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
};

Logger.console = function (msg) {
	var self = Logger;
  if (typeof self.logConsole === 'undefined') {
    return ;
  }
  self.logConsole.trace(msg);
}

Logger.trace = function (msg) {
	var self = Logger;
  self.logConsole.trace(msg);
  self.logAll_.trace(msg);

  if (typeof self.logTrace === 'undefined') {
    return ;
  }
  self.logTrace.trace(msg);
}

Logger.debug = function (msg) {
	var self = Logger;
  self.logConsole.debug(msg);
  self.logAll_.debug(msg);

  if (typeof self.logDebug === 'undefined') {
    return ; 
  }
  self.logDebug.debug(msg);
}

Logger.info = function (msg) {
	var self = Logger;
  self.logConsole.info(msg);
  self.logAll_.info(msg);

  if (typeof self.logInfo === 'undefined') {
    return ;
  }
  self.logInfo.info(msg);
}

Logger.warn = function (msg) {
	var self = Logger;
  self.logConsole.warn(msg);
  self.logAll_.warn(msg);

  if (typeof self.logWarn === 'undefined') {
    return ;
  }
  self.logWarn.warn(msg);
}

Logger.error = function (msg) {
	var self = Logger;
  self.logConsole.error(msg);
  self.logAll_.error(msg);

  if (typeof self.logError === 'undefined') {
    return ;
  }
  self.logError.error(msg);
}

Logger.fatal = function (msg) {
	var self = Logger;
  self.logConsole.fatal(msg);
  self.logAll_.fatal(msg);

  if (typeof self.logFatal === 'undefined') {
    return ;
  }
  self.logFatal.fatal(msg);
	//process.exit(-1);
	log4js.shutdown(function() { process.exit(-1); });
}

module.exports = Logger;
