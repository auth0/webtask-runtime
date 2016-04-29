'use strict';


const Context = require('./context');
const Errors = require('./errors');
const Request = require('./request');
const Storage = require('./storage');


module.exports = {
    run,
};


function run(webtaskFunction, req, res, options, cb) {
    const args = [];
    const webtaskContext = options.context || createContext(req, {
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
                return cb(Errors.create(400, 'Script returned an error.', err));
            }

            try {
                const body = data ? JSON.stringify(data) : '{}';
                
                return Request.ensureRequestConsumed(req, () => {
                    options.writeHead(res, 200, {
                        'Content-Type': 'application/json',
                    });
                    
                    res.end(body);
                    
                    return cb();
                });
            }
            catch (e) {
                return cb(Errors.create(400, 'Error when JSON serializing the result of the JavaScript code.', e));
            }
        });
    }
            
    // Invoke the function

    try {
        return webtaskFunction.apply(this, args);
    }
    catch (e) {
        try {
            return cb(Errors.create(500, 'Script generated an unhandled synchronous exception.', e));
        }
        catch (e1) {
            // ignore
        }

        // terminate the process
        throw e;
    }
}

function createContext(req, options) {
    // If no createStorage function is provided, use the default storage
    // provided by the context api
    const storage = typeof options.createStorage === 'function'
        ?   options.createStorage(req, options)
        :   options.storage || Storage.create(options.initialStorageData);
    
    return Context.create({
        body: req.raw_body,
        container: options.container,
        headers: req.headers,
        mergeBody: req.x_wt.mb,
        params: req.x_wt.pctx,
        query: req.query,
        secrets: req.x_wt.ectx,
        storage,
        token: options.token,
    });
}

