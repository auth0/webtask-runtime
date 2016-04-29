'use strict'


const Errors = require('./errors');
const RawBody = require('raw-body');
const Url = require('url');


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
        : {};
    
    if (req.query.webtask_mb)
        req.x_wt.mb = 1;
    
    if (req.query.webtask_pb)
        req.x_wt.pb = 1;

    cb && cb();
}
 
function readBody(req, options, cb) {   
    const length = req.headers['content-length'];
    
    RawBody(req, {
        length,
        limit: options.maxBodySize,
        encoding: 'utf8',
    }, function (err, body) {
        // Convert raw-body error into a format we can work with
        if (err) {
            const typeToMessage = {
                'entity.too.large': `Script exceeds the size limit of ${options.maxBodySize * 1024}.`,
            };
            const typeToError = {
                'entity.too.large': `Script exceeds the size limit.`,
            };
            
            err.message = typeToMessage[err.type] || err.message;
            
            return cb(Errors.create(err.status, typeToError[err.type] || err.message, err));
        }
        
        req.raw_body = body;
        
        return cb(null, body);
    });
}
