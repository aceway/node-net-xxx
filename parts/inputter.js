'use strict';
var logger = require('../utils/logger.js');

var Inputter = function(schema, host, port) {
	this.schema = schema;
	this.host = host;
	this.port = port;
};

Inputter.prototype.start = function (callback) {
	var self = this;
	logger.info("Input listen on " + self.schema  + "://" + self.host + ":" + self.port);
	callback(null, "OK");
};

module.exports = Inputter;
