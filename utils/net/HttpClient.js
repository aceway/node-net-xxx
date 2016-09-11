'use strict';
var http = require("http");
var util = require("util");
var logger = require("../logger.js");

var HttpClient = function(host, port, callback){
};

HttpClient.prototype.testWorking = function (testCallback ) {
	testCallback(null, "ok");
}

HttpClient.prototype.sendData = function (data, sndCallback ) {
}

module.exports = HttpClient;
