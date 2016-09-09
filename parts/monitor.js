'use strict';
var logger = require('../utils/logger.js');

var Monitor = function(schema, host, port) {
  this.schema = schema;
  this.host = host;
  this.port = port;
};

Monitor.prototype.start = function (callback) {
  var self = this;
  //logger.trace("Monitor listen on " + self.schema  + "://" + 
  //            self.host + ":" + self.port);
  switch(self.schema){
  case 'http':
    callback(null, self.host +":"+ self.port  +
              " would implement schema:" + self.schema);
    break;
  case 'https':
    callback(1, self.host +":"+ self.port  +
              " would implement schema:" + self.schema);
    break;
  case 'websocket':
    callback(1, self.host +":"+ self.port  +
              " would implement schema:" + self.schema);
    break;
  case 'tcp':
    callback(null, self.host +":"+ self.port + 
              " would implement schema:" + self.schema);
    break;
  default:
    callback(-1, self.host +":"+ self.port  +
              " not surpported schema:" + self.schema);
    break;
  }
};

module.exports = Monitor;
