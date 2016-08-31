/**
 * Created by lynx on 2015/5/11.
 */
'use strict';
var http = require("http");
var HttpMessageContext = require("./HttpMessageContext.js");
var logger = require("../logger.js");

function HttpServer(host, port) {
  this.host = host;
  this.port = port;
	this.reqCb = {};
}

HttpServer.prototype.start = function () {
  var self = this;
  var httpServer = http.createServer(function (req, res) {
    var dataChunks = undefined;

    req.on('data', function (chunk) {
      if(dataChunks === undefined) dataChunks = [];
      dataChunks.push(chunk);
    });

    req.on('end', function () {
			for(var cb in self.reqCb){
				if ( self.reqCb[cb] === true ){
					cb(dataChunks);
				}
			};
    });

    req.on('error', function (err) {
      logger.console('request from client err: ' + err);
    });
  });
  httpServer.listen(self.port, self.host);
}

HttpServer.prototype.regReqCallback = function (ReqCallback) {
	var self = this;
	self.reqCb[ReqCallback] = true;
}

HttpServer.prototype.__class__ = "HttpServer";
module.exports = HttpServer;
