'use strict';


const Errors = require('./errors');
const Url = require('url');
const _ = require('lodash');


module.exports = {
    ensureRequestConsumed,
    installEndListener,
    readBody,
    prepareRequest,
};


function ensureRequestConsumed(req, cb) {
    if (req._ended) return cb();
    
    req.once('end', cb);
    req.on('data', function () {});
    req.resume();
}

    
function installEndListener(req, cb) {
    req.once('end', () => {
        req._ended = true;
    });
    
    cb && cb();
}

function prepareRequest(req, cb) {
    req.query = Url.parse(req.url, true).query;
    
    req.x_wt = req.headers['x-wt-params'] 
        ? JSON.parse((new Buffer(req.headers['x-wt-params'], 'base64')))
        : {
            container: '',
        };
    
    if (req.query.webtask_mb)
        req.x_wt.mb = 1;
    
    if (req.query.webtask_pb)
        req.x_wt.pb = 1;

    cb && cb();
}
 
function readBody(req, options, cb) {
    options = _.defaults({}, {
        maxBodySize: undefined,
    }, options);
    
    const chunks = [];
    let length = 0;
    
    req.on('data', (chunk) => {
        chunks.push(chunk);
        length += chunk.length;
        
        if (typeof options.maxBodySize === 'number' && length > options.maxBodySize) {
            req.removeAllListeners('data');
            req.removeAllListeners('end');
            
            const error = new Error(`Script exceeds the size limit of ${options.maxBodySize}.`);
            
            return cb(Errors.create(400, 'Script exceeds the size limit.', error));
        }
    });
    
    req.on('end', () => {
        length; options;
        req.raw_body = Buffer.concat(chunks).toString('utf8');
        
        cb(null, req.raw_body);
    });
}
