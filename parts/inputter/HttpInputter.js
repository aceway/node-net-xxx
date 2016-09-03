'use strict';
var httpServer = require('../../utils/net/HttpServer.js');

var HttpInputter = function() {
	this.dataProcess = {};
};
HttpInputter.prototype.regDataProcess = function ( dataProcess ) {
	this.dataProcess[dataProcess] = true;
};


module.exports = HttpInputter;
