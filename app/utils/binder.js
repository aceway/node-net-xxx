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
    let chckOL = self.checkPartsItems('outputter_listen');
    let chckCN = self.checkPartsItems('outputter_connect');
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
  if (self.cfg && Array.isArray(self.cfg[name]) && self.cfg[name].length > 0){
    let item = null;
    for(let i = 0; i < self.cfg[name].length; i++){
      item = self.cfg[name][i];
      if ( !self.checkOneItem(name, item) ) {
        return false;
      }
    }
    logger.info("Bind config [" + name + "] OK");
    return true;
  }
  else{
    logger.info("Bind config [" + name + "] error.");
    return false;
  }
};

Binder.prototype.checkOneItem = function (name, item) {
  let self = this;
  if (item && typeof item === 'object'){
    let found_schema = false;
    let keys = Object.keys(item);
    let k = null;
    let v = null;
    for(let i = 0; i < keys.length; i++){
      k = keys[i];
      v = item[k];
      if (SCHEMA.indexOf(k.toLowerCase().trim()) >= 0){
        found_schema = true;
        if (typeof v !== 'string' || v.split(':').length !== 2 ||
            isNaN(v.split(':')[1]) ){
          logger.error("Bind config [" + name + 
                       "] format error: " + JSON.stringify(item));
          return false;
        }
        else if (self.host_port[v.toLowerCase().trim()]){
          logger.error("Duplicated host and port: " + 
                        name + " -> " + JSON.stringify(item));
          return false;
        }
        else{
          self.host_port[v.toLowerCase().trim()] = k;
          item.schema = k.toLowerCase().trim();
          item.host = v.split(':')[0].trim();
          item.port = v.split(':')[1].trim();
        }
        break;
      }
    }
    if (found_schema) {
      return true;
    }
    else{
    logger.error("Not supported schema item: " + 
                 name + " -> " + JSON.stringify(item));
      return true;
    }
  }
  else{
    logger.error("Bind config [" + name + 
                 "] error: " + JSON.stringify(item));
    return false;
  }
};


module.exports = Binder;
