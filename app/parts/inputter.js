'use strict';
const logger = require('../utils/logger.js');
const ListenPartBase = require('./listenPartBase.js');

class Inputter extends ListenPartBase{
  constructor(schema, host, port, handler, response){
    super('inputter', schema, host, port, handler, response);
  }
}

module.exports = Inputter;
