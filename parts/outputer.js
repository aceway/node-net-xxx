'use strict';
var logger = require('../utils/logger.js');

var Outputter = function(schema, host, port, mode) {
	this.schema = schema;
	this.host = host;
	this.port = port;
	this.mode = mode;
};

Outputter.prototype.start = function (callback) {
	var self = this;
	var mode_tips = "";
	if (self.mode === "LISTEN"){
		mode_tips = "listen on "
	}
	else{
		mode_tips = "connect to "
	}

	logger.info("Output " + mode_tips + self.schema  + "://" + self.host + ":" + self.port);
	callback(null, self.host +":"+ self.port+":" + self.mode);
};

module.exports = Outputter;
