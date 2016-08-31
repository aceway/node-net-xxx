/*
 *************************************************************************
 *    File Name:  TcpClient.js
 *       Author: Taomee Shanghai,Inc.
 *         Mail: aceway@taomee.com
 * Created Time: Fri 22 Jul 2016 06:01:13 PM CST
 * 
 *  Description: 
 * 
 ************************************************************************
*/
'use strict';
var util = require('util');
var net = require('net');
var async = require('async');

var Queue = require("../Queue.js");
var byteUtils = require("../ByteUtils.js");
var logger= require("../logger.js");

var TcpClient = function(host, port, headlen, rcvCallback){
	var self = this;
	self.host = host;
	self.port = port;
	self.headlen = headlen;
	self.send_queue = new Queue();
	self.ready = false;
	
	self.recv_len = 0;
	self.recv_queue = new Queue();
	self.cache_len = 4 * 1024;
	self.recv_buff = new Buffer( self.cache_len );
	self.recv_buff.fill(0);
	self.rcvCallback = rcvCallback;
	self.local = null;
};

TcpClient.prototype.connect = function(cb){
	var self = this;
	logger.trace("Will try connect to " + self.host + ":" + self.port);
	self.client = net.connect({host:self.host, port:self.port}, function(err, res){
		logger.trace("Established to " + self.host + ":" + self.port + 
		             ", local net info:" + JSON.stringify(self.client.address()));
		self.ready = true;
		self.local = JSON.stringify(self.client.address());
		if ( ! err ) {
			cb(null);
		} 
		else{
			cb(1);
		}
	});
	
	self.client.on('data', function(buff){
		async.waterfall([
			function(cb){
		  	if ( buff && buff.length > 0 ){
		  		logger.trace("Receive data from " + self.host + ":" + 
		  		             self.port + ", len:" + buff.length + 
		  		             ", local net info:" + 
		  		             JSON.stringify(self.client.address()));
		  		//logger.info( buff.toString()  );
		  		if ( self.recv_len === 0 ){
		  			logger.info("NEW DATA ADD TO CHACHE");
		  			if ( buff.length < self.cache_len ){
		  			  buff.copy(self.recv_buff);
		  			}
		  			else{
		  			  // 可以预先多分配一部分
		  			  self.recv_buff = new Buffer( buff );
		  			  self.cache_len = buff.length;
		  			}
		  			self.recv_len = buff.length;
		  			cb(null);
		  		}
		  		else if ( self.recv_len > 0 ){
		  			logger.info("DATA APPEND TO CHACHE");
		  			var tmp_len = self.recv_len + buff.length;
		  			if ( tmp_len < self.cache_len ){
		  			  buff.copy(self.recv_buff, self.recv_len, 
		  			            0, buff.length);
		  			  self.recv_len = tmp_len;
		  			}
		  			else{
		  			  var tmp_buff = self.recv_buff;
		  			  // 可以预先多分配一部分
		  			  self.recv_buff = new Buffer( tmp_len );
		  			  tmp_buff.copy(self.recv_buff, 0, 0, self.recv_len);
		  			  buff.copy(self.recv_buff, self.recv_len, 
		  			            0, buff.length);
		  			  self.cache_len = tmp_len;
		  			  self.recv_len = tmp_len;
		  			}
		  			cb(null);
		  		}
		  		else{
		  			logger.error("error self.recv_len:" + self.recv_len);
		  		  cb(null);
		  		}
		  	}
		  	else{
		  		logger.warn(" net.connect(on , 'data') error, " + 
		  	                "buff is undefined or its len is 0");
		  	  cb(null);
		  	}
		  },
		  function(cb){
		  	while ( self.recv_len > 8 ){
		  	  //logger.info( self.recv_buff.toString()  );
		  	  var totalLen =0;
		  	  var headLen = 0;
		  	  var bodyLen = 0;
		  	  var msgHead = null;
		  	  var msgBody = null;
		  	  totalLen= self.recv_buff.readInt32BE(); 
		  	  if (self.recv_len >= totalLen ){
		  	    headLen = self.recv_buff.readInt32BE(4) - 4; 
		  	    bodyLen = totalLen - headLen - 4 - 4;
		  	    logger.debug("Proto data from server len:" + 
		  	                 totalLen + ", headLen:" + 
		  	                 headLen + ", bodyLen:" + bodyLen);
		  	    if ( headLen > 0 ){
		  	      msgHead = new Buffer( self.recv_buff.slice(8, 
		  	                            8+headLen) );
		  	      if ( bodyLen > 0 ){
		  	        msgBody = new Buffer( self.recv_buff.slice(8 +
		  	                    headLen, totalLen) );
		  	        self.recv_queue.push( {head: msgHead, 
		  	                                  body: msgBody} );
		  	      }
		  	      else{
		  	        self.recv_queue.push( {head: msgHead, 
		  	                                  body: null} );
		  	      }
		  	      self.recv_len -= totalLen;
		  	      if ( self.recv_len > 0 ){
		  	        self.recv_buff.copy(self.recv_buff, 0, totalLen,
		  	                              self.recv_len + totalLen);
		  	      }
		  	    }
		  	    else{
		  	      self.recv_len = 0;
		  	      self.recv_buff.fill(0);
		  	      logger.error("Msg proto headLen error, could " +
		  	                     "not be litter than 0.");
		  	      break;
		  	    }
		  	  }
		  	  else{
		  	    // Data not enough to be parse proto data info
		  	    break;
		  	  }
		  	}
		  	cb(null);
		  },
		  function(cb){
		  	while( self.recv_queue.length > 0 ){
		  		var msg = self.recv_queue.shift();
		  	  self.rcvCallback(null, msg);
		  	}
		  	cb(null);
		  }
		],function(err, cb){
		});
	});
	
	self.client.on('end', function(err){
	  logger.trace("Connection ended with " + self.host + ":" + 
	                 self.port + ":" + err + ", local info:" + self.local);
	  self.ready = false;
	  self.rcvCallback(1, {head: null, body: null});
	});
	
	self.client.on('timeout', function(err){
	  logger.trace("Connection time out with " + self.host + ":" + 
	                 self.port + " :" + err + ", local info:" + self.local);
	  self.ready = false;
	  self.rcvCallback(2, {head: null, body: null});
	});
	
	self.client.on('error', function(err){
	  logger.trace("Connection error with " + self.host + ":" + self.port + 
	                 " :" + err + ", local info:" + self.local);
	  self.ready = false;
	  self.rcvCallback(3, {head: null, body: null});
	});
	
	self.client.on('close', function(err){
	  logger.trace("Connection closed with " + self.host + ":" + self.port + 
	                 " :" + err + ", local info:" + self.local);
	  self.ready = false;
	  self.rcvCallback(4, {head: null, body: null});
	});
	
	self.client.on('drain', function(err){
	  logger.trace("Connection sender buffer is drain, try to send " + 
	                 "buffed next data, " + self.host + ":" + self.port + 
	                 ", local info:" + self.local);
	  if ( self.send_queue.length > 0 ){
	    var tmp_buff = self.send_queue.shift();
	    if (tmp_buff && tmp_buff.length > 0){
	    	self.client.write(tmp_buff);
	    }
	  }
	});
};

TcpClient.prototype.send = function(buff, callback){
  var self = this;
  if ( self.ready ){
    if ( self.client.bufferSize > self.cache_len ){
      self.send_queue.push( buff );
    }
    else{
      self.client.write(buff);
    }
    callback(null);
  }
  else{
    self.send_queue.push( buff );
    callback(1, "未准备就绪");
  }
};


module.exports = TcpClient;
