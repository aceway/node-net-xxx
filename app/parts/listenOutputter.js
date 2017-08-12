'use strict';
const logger = require('../utils/logger.js');
const ListenPartBase = require('./listenPartBase.js');

class ListenOutputter extends ListenPartBase{
  constructor(schema, host, port, handler, response){
    super('listen_outputter', schema, host, port, handler, response);
  }
}

module.exports = ListenOutputter;
