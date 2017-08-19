'use strict';
const logger = require('./logger.js');

const SCHEMA = ['http', 'ws', 'tcp'];
//const SCHEMA = ['http', 'ws', 'tcp', 'https', 'wss', 'udp'];

let Binder = function(cfgJson){
  this.cfg = require(cfgJson);
  this.host_port = {};
};

// Just format check
Binder.prototype.prepareCfg = function (callback) {
	let self = this;
  if ( !self.checkPartsItems('monitor') ) {
	    callback("error", "Bind config monitor error.");
  }
  else if ( !self.checkPartsItems('inputter') ){
	    callback("error", "Bind config inputter error.");
  }
  else{
    let chckOL = self.checkPartsItems('listen_outputter');
    let chckCN = self.checkPartsItems('connect_outputter');
    if (chckOL || chckCN ){
	    callback(null, "Bind config OK");
    }
    else{
	    callback("error", "Bind config outputter error.");
    }
  }
};

Binder.prototype.checkPartsItems = function (name) {
  let self = this;
  if (self.cfg && self.cfg.parts && Array.isArray(self.cfg.parts[name]) && 
      self.cfg.parts[name].length > 0){
    let item = null;
    for(let i = 0; i < self.cfg.parts[name].length; i++){
      item = self.cfg.parts[name][i];
      if ( !self.checkOneItem(name, item) ) {
        return false;
      }
    }
    logger.info("Bind config [" + name + "] OK");
    return true;
  }
  else{
    logger.warn("Bind config [" + name + "] format error.");
    return false;
  }
};

Binder.prototype.checkOneItem = function (name, item) {
  let self = this;
  if (item && typeof item === 'object' && typeof item.schema === 'string' && 
      typeof item.host === 'string' && item.port && !isNaN(item.port) ){
    if (SCHEMA.indexOf(item.schema.toLowerCase().trim()) >= 0){
      let hp = item.host.toLowerCase().trim() + ":" + item.port;
      if ( !self.host_port[hp] ){
        item.schema = item.schema.toLowerCase().trim();
        item.part_type = name.toLowerCase().trim();
        self.host_port[hp] = item.schema;
        return true;
      }
      else{
        logger.error("Duplicated host and port: " + 
                        name + " -> " + JSON.stringify(item));
        return false;
      }
    }
    else{
      logger.error("Not supported schema item: " + 
                   name + " -> " + JSON.stringify(item));
      return false;
    }
  }
  else{
    logger.error("Bind config [" + name + 
                 "] error: " + JSON.stringify(item));
    return false;
  }
};


module.exports = Binder;
