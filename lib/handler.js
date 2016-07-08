'use strict';


const Async = require('async');
const Request = require('./request');
const Runner = require('./runner');
const _ = require('lodash');


module.exports = {
    create,
};


function create(webtaskFunction, options) {
    options = _.defaults({}, options, {
        container: undefined, // Use context default
        context: undefined,
        createStorage: undefined,
        logger: console,
        storage: undefined,
        token: undefined, // Use context default
        writeHead: (res, code, headers) => res.writeHead(code, headers),
        shortcutFavicon: false,
    });
    
    return handleRequest;
    
    
    function handleRequest(req, res) {
        if (options.shortcutFavicon && req.url === '/favicon.ico') {
            options.writeHead(res, 404, {});
            return res.end();
        }
        
        // This is designed for local testing so we are not particularly concerned
        // about letting browsers cache pre-flight requests
        
        if (req.method.toLowerCase() === 'options' && req.headers['access-control-request-method']) {
            res.writeHead(200, {
                'access-control-allow-origin': req.headers['origin'],
                'access-control-allow-methods': req.headers['access-control-request-method'],
                'access-control-allow-headers': req.headers['access-control-request-headers'],
                'access-control-allow-credentials': true,
                'access-control-max-age': 1000 * 60,
            });
            
            return res.end();
        }
        
        
        Async.series([
            (next) => Request.installEndListener(req, next),
            (next) => Request.prepareRequest(req, next),
            (next) => maybeReadBody(req, options, next),
            (next) => Runner.run(webtaskFunction, req, res, options, next),
        ], err => {
            if (err) {
                if (!isNaN(err.code)) {
                    const body = JSON.stringify(err, null, 2);
                    
                    options.logger.info(body);
                    
                    return Request.ensureRequestConsumed(req, () => {
                        options.writeHead(res, err.code, {
                            'Content-Type': 'application/json',
                        });
                        
                        res.end(body);
                    });
                }
                
                const body = JSON.stringify({ 
                    code: 500,
                    error: 'Server error',
                    details: err.toString()
                }, null, 2);
                
                options.logger.info(body);
                
                return Request.ensureRequestConsumed(req, () => {
                    options.writeHead(res, 500, {
                        'Content-Type': 'application/json',
                    });
                    
                    res.end(body);
                });
            }
        });
    }
}
    
    
function maybeReadBody(req, options, cb) {
    if (!req.x_wt.pb) {
        return cb();
    }
    
    return Request.readBody(req, options, cb);
}
