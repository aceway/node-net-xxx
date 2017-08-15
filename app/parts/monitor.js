'use strict';
const logger = require('../utils/logger.js');
const ListenPartBase = require('./listenPartBase.js');

class Monitor extends ListenPartBase{
  constructor(part_cfg, handler){
    part_cfg.response = true;
    super('monitor', part_cfg, handler);
  }
}

module.exports = Monitor;
