'use strict';
const logger = require('../utils/logger.js');

class PartBase {
  constructor(direction, part_type, part_cfg, handler) {
    this.direction = direction;
    this.part_type = part_type;
    this.part_cfg  = part_cfg;
    this.handler   = handler;
    this.id = part_cfg.schema.toUpperCase().trim() + "://" + 
                part_cfg.host.toUpperCase().trim() +
                ":" + (""+part_cfg.port).toUpperCase().trim() + "/";
    this.schema = part_cfg.schema;
    this.net = null;
  }
}

PartBase.prototype.toString = function () {
  return `[direct:${this.direction}, part_type:${this.part_type}, id:${this.id}]`;
};

PartBase.prototype.start = function () {
	let self = this;
  let prr = function(resolve, reject){
		reject(self.part_cfg.host +":"+ self.part_cfg.port + " not supported not, " +
           "would implement schema:" + self.part_cfg.schema);
  };

};

PartBase.prototype.sendData = function (data) {
  let self = this;
  if (self.net && typeof self.net.sendData === 'function'){
    let ret = self.net.sendData(data);
    if (ret instanceof Promise){
      let rt = false;
      ret.then((t)=>{
            rt = true;
          })
          .catch(e => {
            logger.warn(self + ".sendData(...) failed: " + e);
            rt = false;
          });
      return ret;
    }
    else{
      return ret;
    }
  }
  else{
    logger.warn("This part " + self.id + " has no sendData function now.");
    return false;
  }
};

module.exports = PartBase;
