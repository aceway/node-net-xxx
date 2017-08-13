'use strict';
const logger = require('./logger.js');
let tools = {};

tools.getReqIp = function(req){
  return (req || "error req") && 
         ((req.headers && req.headers['x-forwarded-for']) ||
         (req.connection && req.connection.remoteAddress) ||
         (req.socket && req.socket.remoteAddress) ||
         (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
         "Uknown remot IP");
};

module.exports = tools;
