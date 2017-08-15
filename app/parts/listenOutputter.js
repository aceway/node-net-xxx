'use strict';
const logger = require('../utils/logger.js');
const ListenPartBase = require('./listenPartBase.js');

class ListenOutputter extends ListenPartBase{
  constructor(part_cfg, handler){
    super('listen_outputter', part_cfg, handler);
  }
}

module.exports = ListenOutputter;
