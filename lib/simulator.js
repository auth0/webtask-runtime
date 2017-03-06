'use strict';


const Compiler = require('./compiler');
const Context = require('./context');
const Handler = require('./handler');
const Shot = require('shot');
const Storage = require('./storage');
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
        meta: {},
        params: {},
        payload: undefined,
        secrets: {},
    });

    const parsedUrl = Url.parse(options.url, true);

    _.extend(parsedUrl.query, options.query);

    const url = Url.format(parsedUrl);

    return Shot.inject(requestHandler, {
        url,
        method: options.method,
        authority: options.authority,
        headers: options.headers,
        remoteAddress: options.remoteAddress,
        payload: options.payload,
    }, cb);


    function requestHandler(req, res) {
        Context.prepareRequest(req, options);

        if (typeof codeOrWebtaskFunction === 'function') {
            const handleRequest = Handler.create(codeOrWebtaskFunction, options);

            return handleRequest(req, res);
        }

        if (typeof codeOrWebtaskFunction === 'string') {
            const storage = Storage.create(options.initialStorageData);

            options.webtaskApi = {
                storage,
                meta: options.meta,
                params: options.params,
                secrets: options.secrets,
            };

            return Compiler.compile(codeOrWebtaskFunction, options, (err, webtaskFunction) => {
                // Failure to provision the webtask function is fatal
                if (err) {
                    res.writeHead(err.code, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(err, null, 2));

                    return;
                }

                const handleRequest = Handler.create(webtaskFunction, options);

                return handleRequest(req, res);
            });
        }

        throw new Error('The supplied webtaskFunction must be code that exports or returns a function or a function');
    }
}
