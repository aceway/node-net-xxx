'use strict';
var http = require("http");
var queryStr = require('querystring');
var urlMgr = require('url');

var logger = require("../logger.js");

var HttpServer = function(host, port, response) {
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
				var queryInfo = urlMgr.parse(req.url);
				var params = queryStr.parse(queryInfo.query);
				if (typeof dataChunks === 'object'){
					dataChunks['url_params'] = params;
				}
				else{
					dataChunks = params;
				}

				self.rcvCallback(dataChunks, function(err, outputData){
    			dataChunks = undefined;
					if (! err ){
						if ( self.response === true ){
							res.writeHead(200, {'Content-Type': 'text/json'});
							if (typeof outputData === 'string' && outputData.length > 0){
								res.write(outputData);
							}
							else{
								res.write("Nothing response");
							}
							res.end();
						}
						else{
							res.writeHead(200, {'Content-Type': 'text/json'});
							res.end();
						}
					}
					else{
						var tips = "Some thing error:" + error;
						logger.error(tips + ',' + outputData);
						res.writeHead(500, {'Content-Type': 'text/json'});
						res.write(tips);
						res.end();
						logger.warn();
					}
				});
			}
			else{
				logger.warn("The cb:" + self.rcvCallback + " is not a function.");
				res.writeHead(200, {'Content-Type': 'text/json'});
				res.end();
			}
    });

  });

  httpServer.on('error', function (exception, socket) {
		var tips = "Client " + socket.remoteAddress + ':' + socket.remotePort +
				" error:" + exception;
    logger.error(tips);
  });

  httpServer.on('close', function () {
		var tips = "Http server " + self.host + ':' + self.port + ' close';
    logger.error(tips);
  });

  httpServer.listen(self.port, self.host);
	logger.info("Listen on http://" + self.host + ':' + self.port);
}

HttpServer.prototype.__class__ = "HttpServer";
module.exports = HttpServer;
