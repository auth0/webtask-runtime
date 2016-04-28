'use strict';


const Compiler = require('./compiler');
const Context = require('./context');
const Handler = require('./handler');
const Shot = require('shot');
const Url = require('url');
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
        query: {},
        authority: undefined,
        headers: undefined,
        initialStorageData: undefined,
        logger: console,
        remoteAddress: undefined,
        params: {},
        payload: undefined,
        secrets: {},
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
        const parsedUrl = Url.parse(options.url, true);
        
        _.extend(parsedUrl.query, options.query);
        
        const url = Url.format(parsedUrl);
        
        Shot.inject(wrappedHandler, {
            url,
            method: options.method,
            authority: options.authority,
            headers: options.headers,
            remoteAddress: options.remoteAddress,
            payload: options.payload,
        }, cb);
        
        
        function wrappedHandler(req, res) {
            Context.prepareRequest(req, options);
            
            return handler(req, res);
        }
    }
}