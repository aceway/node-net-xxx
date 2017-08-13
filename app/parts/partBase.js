'use strict';
const logger = require('../utils/logger.js');

class PartBase {
  constructor(direction, part_type, schema, host, port, 
              handler, response) {
    this.direction = direction;
    this.part_type = part_type;
    this.schema = schema;
    this.host = host;
    this.port = port;
    this.handler = handler;
    this.response = !!response;
    this.id = schema.toUpperCase().trim() + "://" + host.toUpperCase().trim() +
               ":" + (""+port).toUpperCase().trim() + "/";
  }
}

PartBase.prototype.toString = function () {
  return `[direct:${this.direction}, type:${this.part_type}, id:${this.id}]`;
};

PartBase.prototype.start = function () {
	let self = this;
  let prr = function(resolve, reject){
		reject(self.host +":"+ self.port + " not supported not, " +
           "would implement schema:" + self.schema);
  };

};

PartBase.prototype.sendData = function () {
  logger.warn("This part " + this.id + " has no sendData function now.");
  return false;
};

module.exports = PartBase;
