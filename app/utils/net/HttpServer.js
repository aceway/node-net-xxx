'use strict';
const http = require("http");
const queryStr = require('querystring');
const urlMgr = require('url');

const tools = require("../tools.js");
const logger = require("../logger.js");
const NetBase= require("./NetBase.js");

class HttpServer extends NetBase  {
  constructor(option, handler) {
    super(option, handler);
	  this.isRunning = false;
    this.httpServer= null;
  }
}

HttpServer.prototype.start = function () {
  let self = this;
  let promise = new Promise(function(resolve, reject){
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
	  					logger.warn("HttpServer "+ self.full_name +" error: " + err);
	  					let tips = "Node-net-xxx process data error:" + err;
	  					logger.error("code:-1, desc:'" + tips + "," + outputData +"'}");
	  					res.writeHead(500, {'Content-Type': 'text/json'});
	  					res.write(tips);
	  					res.end();
	  				}
	  				else{
	  					if (['inputter','monitor'].indexOf(self.option.part_type) >= 0){
                //logger.debug('xxxxxxxxxxxxxxx' + JSON.stringify(self.option));
	  						res.writeHead(200, {'Content-Type': 'text/json'});
	  						if (typeof outputData === 'string' && outputData.length > 0){
	  							res.write(outputData);
	  						}
	  						else if (typeof outputData === 'object' && outputData){
                  try{
	  							  res.write(JSON.stringify(outputData));
                  }
                  catch(e){
	  							  res.write("{code:-1, desc:'Node-net-xxx catch exception: " + e + "'}");
                  }
	  						}
	  						else{
	  							res.write("{code:0, desc: 'Nothing response'}");
	  						}
	  						res.end();
	  					}
	  					else{
                let ret = {code: 0};
                ret.desc = 'Neither inputter nor monitor, no respone setting.';
	  						res.writeHead(200, {'Content-Type': 'text/json'});
	  						res.write(JSON.stringify(ret));
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
  return promise;
};

HttpServer.prototype.sendData = function (data, timeout, path, method) {
  // HTTP server could not send data lony.
};

module.exports = HttpServer;
