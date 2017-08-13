'use strict';
const http = require("http");
const queryStr = require('querystring');
const tools = require("../tools.js");
const urlMgr = require('url');

const logger = require("../logger.js");

class HttpServer {
  constructor(host, port, handler, response) {
    this.host = host;
    this.port = port;
    this.handler = handler;
	  this.response = !! response;
	  this.isRunning = false;
    this.full_name = "http://" + this.host + ":" + this.port + "/";
  }
}

HttpServer.prototype.start = function () {
  let self = this;
  let promiss = new Promise(function(resolve, reject){
    if (self.isRunning === true){
      return resolve("OK");
    }
    let httpServer = http.createServer(function (req, res) {
      let dataChunks = null;
      req.on('data', function (chunk) {
        if(dataChunks === null) { dataChunks = []; }
        dataChunks.push(chunk);
      });

      req.on('end', function () {
	  		if ( typeof self.handler === 'function' ){
	  			let queryInfo = urlMgr.parse(req.url);
	  			let params = queryStr.parse(queryInfo.query);
          let data = null;
	  			if (dataChunks && dataChunks.length > 0){
            //logger.debug('xxxxxxxxxxxxxxxxxxxxxxx');
            let str = Buffer.concat(dataChunks).toString('utf8');
            try{
              data = JSON.parse(str);
            }
            catch(e){
              data = {};
              data.error = e + "";
              data.desc = str;
            }
            let keys = Object.keys(params);
            let k = null;
            for(let i=0; i < keys.length; i++){
              k = keys[i];
              if (!data.hasOwnProperty(k)){
                data[k] = params[k];
              }
            }
	  			}
	  			else{
            //logger.debug('yyyyyyyyyyyyyyyyyyyyyyyyy');
	  				data = params;
	  			}
          let from = tools.getReqIp(req);
          let info = {'data': data, 'part': self.full_name, 'from':from};
	  			self.handler(info, function(err, outputData){
            dataChunks = null;
      			data = null;
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
	  					let tips = "Some thing error:" + err;
	  					logger.error(tips + ',' + outputData);
	  					res.writeHead(500, {'Content-Type': 'text/json'});
	  					res.write(tips);
	  					res.end();
	  					logger.warn("HttpServer "+ self.full_name +" error: " + err);
	  				}
	  			});
	  		}
	  		else{
	  			logger.warn("The cb:" + self.handler + " is not a function.");
	  			res.writeHead(200, {'Content-Type': 'text/json'});
	  			res.end();
	  		}
      });
    });

    httpServer.on('listening', function () {
      let address = httpServer.address();
      resolve("OK");
	    logger.info("Listen http on: " + JSON.stringify(address));
      if ( !self.isRunning ){
        self.isRunning = true;
      }
    });

    httpServer.on('error', function (e) {
      // TODO: resolve some error as reject
	  	let tips = "HTTP error:" + e;
      logger.error(tips);
      if ( !self.isRunning ){
        reject(tips);
      }
    });

    httpServer.on('close', function (error) {
	  	let tips = "Http server " + self.host + ':' + self.port + ' close';
      logger.error(tips);
      if (self.isRunning === true){
        self.isRunning = false;
        return reject("error: " + error );
      }
    });

    httpServer.listen(self.port, self.host);
  });
  return promiss;
};

HttpServer.prototype.__class__ = "HttpServer";
module.exports = HttpServer;
