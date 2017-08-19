'use strict';
const logger = require("../logger.js");

class NetBase {
  constructor(option, handler) {
    this.option = option;
    this.handler = handler;
    this.full_name = this.option.schema + "://" + this.option.host + 
                     ":" + this.option.port + "/";
  }
}

NetBase.prototype.toString = function(){
  return this.full_name;
};

module.exports = NetBase;

