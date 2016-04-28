'use strict';


const Async = require('async');
const Context = require('./context');
const RawBody = require('raw-body');
const Url = require('url');
const _ = require('lodash');


module.exports = {
    create,
};


function create(webtaskFunction, options) {
    options = _.defaults({}, options, {
        container: undefined, // Use context default
        createContext,
        createStorage: undefined,
        logger: console,
        prepareRequest,
        storage: undefined,
        token: undefined, // Use context default
        writeHead: (res, code, headers) => res.writeHead(code, headers),
    });
    
    return handleRequest;
    
    
    function handleRequest(req, res) {
        Async.series([
            (next) => prepareRequest(req, res, next),
            (next) => maybeParseBody(req, res, next),
            (next) => runWebtaskFunction(req, res, next),
        ], err => {
            if (err) {
                if (!isNaN(err.code)) {
                    const body = JSON.stringify(err, null, 2);
                    
                    options.logger.info(body);
                    
                    return ensureRequestConsumed(req, () => {
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
                
                return ensureRequestConsumed(req, () => {
                    options.writeHead(res, 500, {
                        'Content-Type': 'application/json',
                    });
                    
                    res.end(body);
                });
            }
        });
    }
    
    function prepareRequest(req, res, cb) {
        req.once('end', () => {
            req._ended = true;
        });
        
        req.query = Url.parse(req.url, true).query;
        
        req.x_wt = req.headers['x-wt-params'] 
            ? JSON.parse((new Buffer(req.headers['x-wt-params'], 'base64')))
            : {};
        
        if (req.query.webtask_mb)
            req.x_wt.mb = 1;
        
        if (req.query.webtask_pb)
            req.x_wt.pb = 1;

        cb();
    }
    
    function maybeParseBody(req, res, cb) {
        if (!req.x_wt.pb) return cb();
        
        const length = req.headers['content-length'];
        
        RawBody(req, {
            length,
            limit: options.maxBodySize,
            encoding: 'utf8',
        }, function (err, body) {
            // Convert raw-body error into a format we can work with
            if (err) {
                const codeToMessage = {
                    'entity.too.large': `Script exceeds the size limit of ${options.maxBodySize}.`,
                };
                const codeToError = {
                    'entity.too.large': `Script exceeds the size limit.`,
                };
                
                err.message = codeToMessage[err.code] || err.message;
                
                return cb(createError(err.status, codeToError[err.code] || err.message, err));
            }
            
            req.raw_body = body;
            
            return cb();
        });
    }
    
    function runWebtaskFunction(req, res, cb) {
        const args = [];
        const webtaskContext = options.createContext(req, {
            body: req.body,
            container: options.container,
            headers: req.headers,
            reqId: req.x_wt.req_id,
            mergeBody: req.x_wt.mb,
            params: req.x_wt.pctx,
            parseBody: req.x_wt.pb,
            query: req.query,
            secrets: req.x_wt.ectx,
            storage: options.storage,
            token: options.token,
            signature: options.signature,
        });
        
        if (webtaskFunction.length === 3) {

            // (ctx, req, res)

            args.push(webtaskContext);
            args.push(req);
            args.push(res);
        }
        else {

            // ([ctx], callback)
        
            if (webtaskFunction.length === 2) {
                // Function accepts context parameter - create it and add to arguments
                args.push(webtaskContext);
            }
            
            args.push(function (err, data) {
                if (err) {
                    return cb(createError(400, 'Script returned an error.', err));
                }

                try {
                    const body = data ? JSON.stringify(data, null, 2) : '{}';
                    
                    return ensureRequestConsumed(req, () => {
                        options.writeHead(res, 200, {
                            'Content-Type': 'application/json',
                        });
                        
                        res.end(body);
                        
                        return cb();
                    });
                }
                catch (e) {
                    return cb(createError(400, 'Error when JSON serializing the result of the JavaScript code.', e));
                }
            });
        }
                
        // Invoke the function

        try {
            return webtaskFunction.apply(this, args);
        }
        catch (e) {
            try {
                return cb(createError(500, 'Script generated an unhandled synchronous exception.', e));
            }
            catch (e1) {
                // ignore
            }

            // terminate the process
            throw e;
        }
    }
}
    
function createContext(req, options) {
    return Context.create({
        body: req.body,
        container: options.container,
        headers: req.headers,
        mergeBody: req.x_wt.mb,
        params: req.x_wt.pctx,
        query: req.query,
        secrets: req.x_wt.ectx,
        // If no createStorage function is provided, use the default storage
        // provided by the context api
        storage: typeof options.createStorage === 'function'
            ?   options.createStorage(req, options)
            :   options.storage,
        token: options.token,
    });
}

function createError(code, description, source) {
    const error = new Error();
    
    error.code = code;
    error.error = description;
    error.details = source instanceof Error ? source.toString() : source;
    error.name = source.name;
    error.message = source.message;
    error.stack = source.stack;
        
    return error;
}

function ensureRequestConsumed(req, cb) {
    if (req._ended) return cb();
    
    req.once('end', cb);
    req.on('data', function () {});
    req.resume();
}
