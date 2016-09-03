'use strict';
var http = require("http");
var logger = require("../logger.js");

function HttpServer(host, port) {
  this.host = host;
  this.port = port;
  this.rcvCbs = {};
}

HttpServer.prototype.regRcvCallback = function ( rcvCallback ) {
	this.rcvCbs[rcvCallback] = true;
};

HttpServer.prototype.start = function () {
  var self = this;
  var httpServer = http.createServer(function (req, res) {
    var dataChunks = undefined;
    req.on('data', function (chunk) {
      if(dataChunks === undefined) dataChunks = [];
      dataChunks.push(chunk);
    });

    req.on('end', function () {
			for(var cb in self.rcvCbs){
				if ( self.rcvCbs[cb] === true ){
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

HttpServer.prototype.__class__ = "HttpServer";
module.exports = HttpServer;
