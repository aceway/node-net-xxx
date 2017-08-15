'use strict';
const logger = require('../utils/logger.js');
const ListenPartBase = require('./listenPartBase.js');

class Inputter extends ListenPartBase{
  constructor(part_cfg, handler){
    super('inputter', part_cfg, handler);
  }
}

module.exports = Inputter;
