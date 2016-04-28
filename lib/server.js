'use strict';


const Assert = require('assert');
const Compiler = require('./compiler');
const Context = require('./context');
const Handler = require('./handler');
const Http = require('http');
const _ = require('lodash');


module.exports = {
    create,
};


function create(codeOrWebtaskFunction, options) {
    options = _.defaults({}, options, {
        initialStorageData: undefined,
        logger: console,
        mergeBody: false,
        params: {},
        parseBody: false,
        secrets: {},
        signature: undefined,
        token: undefined,
    });
    
    // Queue to handle multiple requests coming in before the webtask
    // function is provisioned (async operation).
    const requestQueue = [];
    let requestHandler;
    let provisioningRequestHandler = false;
    
    return new Http.Server((req, res) => {
        Context.prepareRequest(req, options);
        
        if (!requestHandler) {
            if (!requestHandler) {
                requestQueue.push({ req, res });
            }
            
            if (!provisioningRequestHandler) {
                provisioningRequestHandler = true;
                
                if (typeof codeOrWebtaskFunction === 'string') {
                    return Compiler.compile(codeOrWebtaskFunction, options, (err, webtaskFunction) => {
                        // Failure to provision the webtask function is fatal
                        if (err) throw err;
                        
                        requestHandler = Handler.create(webtaskFunction, options);
                        
                        // Drain the queue
                        while (requestQueue.length) {
                            // Handle items in FIFO order
                            const missed = requestQueue.shift();
                            
                            requestHandler(missed.req, missed.res);
                        }
                    });
                }
                
                Assert.equal(typeof codeOrWebtaskFunction, 'function', 'A webtask function, or code that either exports or returns a webtask, is required.');
                    
                // Transform the webtask function into a handler
                requestHandler = Handler.create(codeOrWebtaskFunction, options);
            }
        }
        
        return requestHandler(req, res);
    });
}