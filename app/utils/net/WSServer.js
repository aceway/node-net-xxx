'use strict';
const logger = require("../logger.js");

class WSServer{
  constructor(host, port, handler, response){
    this.host = host;
    this.port = port;
    this.handler = handler;
	  this.response = !! response;
	  this.isRunning = false;
    this.full_name = "ws://" + this.host + ":" + this.port + "/";
  }
}

WSServer.prototype.start = function () {
  let self = this;
  let promiss = new Promise(function(resolve, reject){
    if (self.isRunning === true){
      return resolve("OK");
    }
  });
  return promiss;
};

module.exports = WSServer;
