'use strict';
const logger = require('../utils/logger.js');
const ConnectPartBase = require('./connectPartBase.js');

class ConnectOutputter extends ConnectPartBase{
  constructor(part_cfg, handler){
    super('connect_outputter', part_cfg, handler);
  }
}

module.exports = ConnectOutputter;
