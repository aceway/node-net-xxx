'use strict';
const http = require("http");
const querystring = require("querystring");
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
  return self.sendData({'data': "node-net-xxx ping!"},3000,'/node-net-xxx/', 'get');
          //.then( (e)=>{self.sendData({'data': 'again'});});
};

HttpClient.prototype.sendData = function (data, timeout, path, method) {
  let self = this;
  let promiss = new Promise((resolve, reject) => {
		let postData = null;
    if (typeof data === 'string'){
		  postData = data;
    }
    else{
		  postData = querystring.stringify(data);
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
        'Content-Type': 'application/x-www-form-urlencoded',
        //'Content-Length': Buffer.byteLength(postData)
        //'Content-Type': 'text/json',
        'Content-Length': postData.length
      },
      timeout: isNaN(timeout) || Number(timeout) < 0 ? 1000 : Number(timeout)
    };

    let has_return = false;
    let req = http.request(options, (res) => {
      logger.trace(`STATUS: ${res.statusCode}`);
      logger.trace(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      let dataChunks = null;
      res.on('data', (chunk) => {
        if(dataChunks === null) { dataChunks = []; }
        dataChunks.push(chunk);
      });
      res.on('end', () => {
        logger.trace("BODY: " + dataChunks);
        if (typeof self.handler === 'function'){
          let from = "Get data from connect " +  self.full_name;
          self.handler(from, dataChunks.toString());
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
    
    req.write(postData);
    req.end();
  });
  return promiss;
};

module.exports = HttpClient;
