'use strict';
var logger = require('../utils/logger.js');

var Monitor = function(schema, host, port) {
	this.schema = schema;
	this.host = host;
	this.port = port;
};

Monitor.prototype.start = function (callback) {
	var self = this;
	logger.info("Monitor listen on " + self.schema  + "://" + self.host + ":" + self.port);
	callback(null, "OK");
};

module.exports = Monitor;
