/**
 * Created by lynx on 2015/5/26.
 */
var http = require("http");
var https = require("https");
var Url = require("url");
var util = require("util");
var logger = require("./../utils/Logger.js");
var querystring = require("querystring");
var httpClient = {};


function maybeCallback(cb) {
    return util.isFunction(cb) ? cb : rethrow();
}

function rethrow() {
    // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
    // is fairly slow to generate.
    if (DEBUG) {
        var backtrace = new Error;
        return function(err) {
            if (err) {
                backtrace.stack = err.name + ': ' + err.message +
                backtrace.stack.substr(backtrace.name.length);
                err = backtrace;
                throw err;
            }
        };
    }

    return function(err) {
        if (err) {
            throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
        }
    };
}

var httpContentType = {}
httpContentType.FORM = "application/x-www-form-urlencoded";

var formatType = {};
formatType.QueryString = "querystring";
formatType.JSON = "json";
formatType.String = "string";
formatType.Buffer = "buffer";

formatType.encodeFuncs = {};
formatType.encodeFuncs[formatType.QueryString] = function encodeQueryString(data){
    return querystring.stringify(data);
}
formatType.encodeFuncs[formatType.JSON] = function encodeJSON(data){
    return JSON.stringify(data);
}
formatType.encodeFuncs[formatType.String] = function encodeString(data){
    return data + "";
}
formatType.encodeFuncs[formatType.Buffer] = function encodeBuffer(data){
    return data;
}

formatType.decodeFuncs = {};
formatType.decodeFuncs[formatType.QueryString] = function decodeQueryString(buf){
    return querystring.parse(buf.toString("utf-8"));
}
formatType.decodeFuncs[formatType.JSON] = function decodeJSON(buf){
    return JSON.parse(buf.toString("utf-8"));
}
formatType.decodeFuncs[formatType.String] = function decodeString(buf){
    return buf.toString("utf-8");
}
formatType.decodeFuncs[formatType.Buffer] = function decodeBuffer(buf){
    return buf;
}

formatType.decode = function(format, buf) {
    return formatType.decodeFuncs[format](buf);
}

formatType.encode = function(format, data) {
    return formatType.encodeFuncs[format](data);
}

httpClient.httpsGetJson = function(url, callback) {
    this._httpGet(https, url, formatType.JSON, callback)
}

httpClient.httpsGetQueryString = function(url, callback) {
    this._httpGet(https, url, formatType.QueryString, callback)
}

httpClient.httpGetJson = function(url, callback) {
    this._httpGet(https, url, formatType.JSON, callback)
}

httpClient.httpsGet = function(url, format, callback) {
    var callback = maybeCallback(arguments[arguments.length - 1]);
    if (util.isFunction(format) || !format) { format = formatType.Buffer;}
    this._httpGet(https, url, format, callback)
}

httpClient.httpGet = function(url, format, callback) {
    var callback = maybeCallback(arguments[arguments.length - 1]);
    if (util.isFunction(format) || !format) { format = formatType.Buffer;}
    this._httpGet(http, url, format, callback)
}

httpClient._httpGet = function(httpObj, url, format, callback) {
    var callback = maybeCallback(arguments[arguments.length - 1]);
    if (util.isFunction(format) || !format) { format = formatType.Buffer;}
    logger.trace("http get request url:" + url);
    httpObj.get(url, function(res) {
        res.on('data', function(buf) {
            var result = formatType.decode(format, buf);
            logger.trace("http get response url:" + url + ", data:" + result);
            callback(null, res, result);
        });
    }).on('error', function(e) {
        logger.error("http get response err url:" + url + ", err:" + e);
        callback(e);
    });
}


httpClient.httpsPostJson = function(url, data, callback) {
    this._httpPost(https, url, data, formatType.JSON, formatType.JSON, callback)
}

httpClient.httpPostJson = function(url, data, callback) {
    this._httpPost(http, url, data, formatType.JSON, formatType.JSON, callback)
}

httpClient.httpsPostQueryString = function(url, data, callback) {
    this._httpPost(https, url, data, formatType.QueryString, formatType.QueryString, callback)
}

httpClient.httpPostQueryString = function(url, data, callback) {
    this._httpPost(http, url, data, formatType.QueryString, formatType.QueryString, callback)
}

httpClient.httpsPostQueryStringReJson = function(url, data, callback) {
    this._httpPost(https, url, data, formatType.QueryString, formatType.JSON, callback)
}

httpClient.httpPostQueryStringReJson = function(url, data, callback) {
    this._httpPost(http, url, data, formatType.QueryString, formatType.JSON, callback)
}

httpClient.httpsPostFormQueryStringReJson = function(url, data, callback) {
    this._httpPostContentType(https, url, data, httpContentType.FORM, formatType.QueryString, formatType.JSON, callback)
}

httpClient.httpPostFormQueryStringReJson = function(url, data, callback) {
    this._httpPostContentType(http, url, data, httpContentType.FORM, formatType.QueryString, formatType.JSON, callback)
}

httpClient.httpsPost = function(url, data, requestFormat, responseFormat, callback) {
    var callback = maybeCallback(arguments[arguments.length - 1]);
    if (util.isFunction(requestFormat) || !requestFormat) { requestFormat = formatType.Buffer;}
    if (util.isFunction(responseFormat) || !responseFormat) { responseFormat = formatType.Buffer;}
    this._httpPost(https, url, data, requestFormat, responseFormat, callback)
}

httpClient.httpPost = function(url, data, requestFormat, responseFormat, callback) {
    var callback = maybeCallback(arguments[arguments.length - 1]);
    if (util.isFunction(requestFormat) || !requestFormat) { requestFormat = formatType.Buffer;}
    if (util.isFunction(responseFormat) || !responseFormat) { responseFormat = formatType.Buffer;}
    this._httpPost(http, url, data, requestFormat, responseFormat, callback)
}

httpClient._httpPost = function(httpObj, url, data, requestFormat, responseFormat, callback) {
    var callback = maybeCallback(arguments[arguments.length - 1]);
    if (util.isFunction(requestFormat) || !requestFormat) { requestFormat = formatType.Buffer;}
    if (util.isFunction(responseFormat) || !responseFormat) { responseFormat = formatType.Buffer;}
    this._httpPostContentType(httpObj, url, data, undefined, requestFormat, responseFormat, callback);
}

httpClient._httpPostContentType = function(httpObj, url, data, contentType, requestFormat, responseFormat, callback) {
    var callback = maybeCallback(arguments[arguments.length - 1]);
    if (util.isFunction(requestFormat) || !requestFormat) { requestFormat = formatType.Buffer;}
    if (util.isFunction(responseFormat) || !responseFormat) { responseFormat = formatType.Buffer;}
    var uri = Url.parse(url);
    var opt = {
        hostname:uri.hostname,
        method:'POST',
        path:uri.path,
        headers:{

        }
    }

    if(uri.port)
        opt.port = uri.port;
    var requestBody = formatType.encode(requestFormat, data);

    if(contentType === httpContentType.FORM){
        opt.headers[ 'Content-Type'] = httpContentType.FORM;
        opt.headers[ 'Content-Length'] = requestBody.length;
    }

    logger.trace("http POST request url:" + url + ", host:" + uri.host + ", port:" + uri.port + ", data:" + requestBody);
    var req = httpObj.request(opt, function(res) {
        res.on('data', function(buf) {
            var result;
            var resErr;
            try{
                result = formatType.decode(responseFormat, buf);
                logger.trace("http POST response url:" + url + ", host:" + uri.host + ", port:" + uri.port + ", data:" + JSON.stringify(result));
            }catch(err){
                logger.trace("http POST response url:" + url + ", host:" + uri.host + ", port:" + uri.port + ", responseFormat:" + responseFormat + ", err:" + err + ", buf:" + (buf ? buf.toString("utf-8") : buf + ""));
                resErr = err;
            }
            callback(resErr, res, result);
        });
    }).on('error', function(e) {
        logger.trace("http POST response url:" + url + ", host:" + uri.host + ", port:" + uri.port + ", err:" + e);
        callback(e);
    });
    //req.setHeader( "Content-Length",requestBody.length);
    req.write(requestBody);
    req.end();
}
httpClient.formatType = formatType;
module.exports = httpClient;
