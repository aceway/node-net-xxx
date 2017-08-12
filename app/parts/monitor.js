'use strict';
const logger = require('../utils/logger.js');
const ListenPartBase = require('./listenPartBase.js');

class Monitor extends ListenPartBase{
  constructor(schema, host, port, handler, response){
    super('monitor', schema, host, port, handler, true);
  }
}

module.exports = Monitor;
