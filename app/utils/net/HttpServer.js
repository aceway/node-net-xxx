'use strict';
const http = require("http");
const queryStr = require('querystring');
const tools = require("../tools.js");
const urlMgr = require('url');

const logger = require("../logger.js");

class HttpServer {
  constructor(option, handler) {
    this.option = option;
    this.handler = handler;
	  this.isRunning = false;
    this.full_name = "http://" + this.option.host + ":" + this.option.port + "/";
    this.httpServer= null;
  }
}

HttpServer.prototype.start = function () {
  let self = this;
  let promiss = new Promise(function(resolve, reject){
    if (self.httpServer && self.isRunning === true){
      return resolve("OK");
    }
    self.httpServer = http.createServer(function (req, res) {
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
	  				if (err){
              logger.error("HttpServer call data handler but return error:" + err);
	  					let tips = "Node-net-xxx process data error:" + err;
	  					logger.error(tips + ',' + outputData);
	  					res.writeHead(500, {'Content-Type': 'text/json'});
	  					res.write(tips);
	  					res.end();
	  					logger.warn("HttpServer "+ self.full_name +" error: " + err);
	  				}
	  				else{
	  					if (['inputter', 'monitor'].indexOf(self.option.part_type) >= 0 &&
                  self.option.response === true ){
	  						res.writeHead(200, {'Content-Type': 'text/json'});
	  						if (typeof outputData === 'string' && outputData.length > 0){
	  							res.write(outputData);
	  						}
	  						else if (typeof outputData === 'object' ){
                  try{
	  							  res.write(JSON.stringify(outputData));
                  }
                  catch(e){
	  							  res.write(e + "");
                  }
	  						}
	  						else{
	  							res.write("{desc: 'Nothing response'}");
	  						}
	  						res.end();
	  					}
	  					else{
                let result = {code: 0, desc:'not inputter or monitor, or not set createServerp'};
                result.data = self.option;
	  						res.writeHead(200, {'Content-Type': 'text/json'});
	  						res.write(JSON.stringify(result));
	  						res.end();
	  					}
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

    self.httpServer.on('listening', function () {
      let address = self.httpServer.address();
      resolve("OK");
	    logger.info("Listen http on: " + JSON.stringify(address));
      if ( !self.isRunning ){
        self.isRunning = true;
      }
    });

    self.httpServer.on('error', function (e) {
      // TODO: resolve some error as reject
	  	let tips = "HTTP error:" + e;
      logger.error(tips);
      if ( !self.isRunning ){
        reject(tips);
      }
    });

    self.httpServer.on('close', function (error) {
	  	let tips = "Http server " + self.option.host + ':' + self.option.port + ' close';
      logger.error(tips);
      if (self.isRunning === true){
        self.isRunning = false;
        return reject("error: " + error );
      }
    });

    self.httpServer.listen(self.option);
  });
  return promiss;
};

HttpServer.prototype.sendData = function (data, timeout, path, method) {
  // HTTP server could not send data lony.
};

module.exports = HttpServer;
