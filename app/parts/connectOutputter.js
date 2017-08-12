'use strict';
const logger = require('../utils/logger.js');
const ConnectPartBase = require('./connectPartBase.js');

class ConnectOutputter extends ConnectPartBase{
  constructor(schema, host, port, handler, response){
    super('connect_outputter', schema, host, port, handler, response);
  }
}

module.exports = ConnectOutputter;
