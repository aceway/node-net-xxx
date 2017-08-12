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
    this.full_name = schema + "://" + host + ":" + port + "/";
  }
}

PartBase.prototype.start = function () {
	let self = this;
  let prr = function(resolve, reject){
		reject(self.host +":"+ self.port + " not supported not, " +
           "would implement schema:" + self.schema);
  };

};

module.exports = PartBase;
