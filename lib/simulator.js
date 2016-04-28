'use strict';


const Compiler = require('./compiler');
const Handler = require('./handler');
const Shot = require('shot');
const _ = require('lodash');


module.exports = {
    simulate,
};


function simulate(codeOrWebtaskFunction, options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }
    
    options = _.defaults({}, options, {
        method: 'GET',
        url: '/',
        authority: undefined,
        headers: undefined,
        logger: console,
        remoteAddress: undefined,
        payload: undefined,
    });
    
    if (typeof codeOrWebtaskFunction === 'string') {
        return Compiler.compile(codeOrWebtaskFunction, options, (err, webtaskFunction) => {
            if (err) throw err;
            
            return createAndInvokeHandler(webtaskFunction);
        });
    } else if (typeof codeOrWebtaskFunction === 'function') {
        return createAndInvokeHandler(codeOrWebtaskFunction);
    }
    
    throw new Error('Invalid webtask function');
    
    
    function createAndInvokeHandler(webtaskFunction) {
        const handler = Handler.create(webtaskFunction, options);
        
        Shot.inject(handler, {
            url: options.url,
            method: options.method,
            authority: options.authority,
            headers: options.headers,
            remoteAddress: options.remoteAddress,
            payload: options.payload,
        }, cb);
    }
}