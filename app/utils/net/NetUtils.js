/**
 * Created by lynx on 2015/6/3.
 */
'use strict';
var logger = require("../logger.js");
var netUtils = {};
/**
 *
 * @param {IncomingMessage} req
 */
netUtils.getClientIp = function(req){
    var address = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    if(address)
        return address.split(',')[0];
    return address;
}

netUtils.getData = function(req, callback){
    var dataChunks = [];
    req.on('data', function(chunk) {
        dataChunks.push(chunk);
    });
    req.on('end', function() {
        callback(null, Buffer.concat(dataChunks));
    });
}

module.exports = netUtils;
