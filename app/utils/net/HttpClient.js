'use strict';
const http = require("http");
const util = require("util");
const logger = require("../logger.js");

const METHODS = ['post', 'get'];

class HttpClient {
  constructor(host, port, handler) {
    this.host = host;
    this.port = port;
    this.handler = handler;
    this.full_name = "http://" + this.host + ":" + this.port + "/";
  }
}

HttpClient.prototype.connect = function () {
  let self = this;
  return self.sendData({'data':"node-net-xxx ping!"},3000,'/node-net-xxx/', 'post');
          //.then( (e)=>{self.sendData({'data': 'again'});});
};

HttpClient.prototype.sendData = function (data, timeout, path, method) {
  let self = this;
  let promiss = new Promise((resolve, reject) => {
		let commitData = null;
    if (typeof data === 'string'){
		  commitData = data;
    }
    else{
		  commitData = JSON.stringify(data);
    }
    let m = typeof method==='string' ? 
                   method.toLowerCase().trim() : method + "";
    const options = {
      host: self.host,
      hostname: self.host,
      port: self.port,
      path: typeof path === 'string' ? path : '/',
      method: METHODS.indexOf(m) >= 0 ?  m : 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Length': commitData.length
      },
      timeout: isNaN(timeout) || Number(timeout) < 0 ? 1000 : Number(timeout)
    };

    let has_return = false;
    let req = http.request(options, (res) => {
      //logger.trace(`STATUS: ${res.statusCode}`);
      //logger.trace(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      let dataChunks = null;
      res.on('data', (chunk) => {
        if(dataChunks === null) { dataChunks = []; }
        dataChunks.push(chunk);
      });
      res.on('end', () => {
        let retData = null;
	  		if (dataChunks && dataChunks.length > 0 && typeof dataChunks[0] === typeof Buffer){
          //logger.debug('zzzzzzzzzzzzzzzzzzzz');
          let str = Buffer.concat(dataChunks).toString('utf8');
          try{
            retData = JSON.parse(str);
          }
          catch(e){
            retData = {};
            retData.error = e + "";
            retData.desc = str;
          }
	  		}
	  		else if (dataChunks && dataChunks.length > 0 && typeof dataChunks[0] === 'string'){
          //logger.debug('xxxxxxxxxxxxxxxxxxxxxxx');
          let str = dataChunks.toString('utf8');
          try{
            retData = JSON.parse(str);
          }
          catch(e){
            retData = {};
            retData.error = e + "";
            retData.desc = str;
          }
	  		}
	  		else{
          //logger.debug('yyyyyyyyyyyyyyyyyyyyyyyyy');
	  			retData = [];
	  		}
        dataChunks = null;

        //logger.trace("DATA: " + JSON.stringify(retData));
        if (typeof self.handler === 'function'){
          let from = self.host;
          let info = {'data': data, 'part': self.full_name, 'from':from};
          self.handler(info);
        }

        if (!has_return){
          has_return = true;
          resolve("OK");
        }
      });
    });

    req.on('error', (e) => {
      let tips = `${self.full_name} problem with request: ${e.message}`;
      logger.error(tips);
      if (!has_return){
        has_return = true;
        reject(tips);
      }
    });
    
    req.write(commitData);
    req.end();
  });
  return promiss;
};

module.exports = HttpClient;
