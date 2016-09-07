'use strict';
var http = require("http");
var logger = require("../logger.js");

function HttpServer(host, port, response) {
  this.host = host;
  this.port = port;
  this.rcvCallback = null;
	this.response = !! response;
}

HttpServer.prototype.regRcvCallback = function ( rcvCallback ) {
	this.rcvCallback = rcvCallback;
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
			if ( typeof self.rcvCallback === 'function' ){
				self.rcvCallback(dataChunks, function(err, outputData){
					if (! err ){
						if ( self.response === true ){
							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.write(outputData);
							res.end();
						}
						else{
							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.end();
						}
					}
					else{
						res.writeHead(500, {'Content-Type': 'text/plain'});
						res.end();
						logger.warn();
					}
				});
			}
			else{
				logger.warn("The cb:"+self.rcvCallback+" is not a function.");
			}
    });

    req.on('error', function (err) {
      logger.console('request from client err: ' + err);
    });
  });
  httpServer.listen(self.port, self.host);
}

HttpServer.prototype.__class__ = "HttpServer";
module.exports = HttpServer;
