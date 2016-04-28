'use strict';


const Crypto = require('crypto');
const Jwt = require('jsonwebtoken');
const Querystring = require('querystring');
const Storage = require('./storage');
const _ = require('lodash');


module.exports = {
    create,
};


function create(options) {
    options = _.defaultsDeep({}, options, {
        body: undefined,
        container: 'container',
        headers: {
            'content-type': 'application/json',
        },
        mergeBody: false,
        params: {},
        query: {},
        secrets: {},
        storage: Storage.create(options.initialDate),
        token: undefined,
        signature: Crypto.randomBytes(32).toString('base64').slice(0, 32),
    });

    if (options.headers) {
        options.headers = _.mapKeys(options.headers, k => k.toLowerCase());
    }
    
    
    if (!options.token) {
        options.token = Jwt.sign({
            ca: [],
            dd: 1,
            jti: Crypto.randomBytes(32).toString('base64').slice(0, 32),
            iat: Date.now(),
            ten: options.container,
        }, options.signature);
    }
    
    const context = {
        data: {},
        id: String(Date.now()),
        params: {},
        query: {},
        secrets: {},
        storage: options.storage,
        token: options.token,
    };

    for (var i in options.query) {
        if (i.indexOf('webtask_') !== 0) {
            context.data[i] = options.query[i];
            context.query[i] = options.query[i];
        }
    }

    for (var k in options.params) {
        context.data[k] = context.params[k] = options.params[k];
    }

    for (var k in options.secrets) {
        context.data[k] = context.secrets[k] = options.secrets[k];
    }
    
    if (options.body) {
        context.body_raw = options.body;
        
        try {
            if (options.headers['content-type'].indexOf('application/x-www-form-urlencoded') >= 0)
                context.body = Querystring.parse(options.body);
            else if (options.headers['content-type'].indexOf('application/json') >= 0)
                context.body = JSON.parse(options.body);
        }
        catch (e) {
            // ignore
        }
        
        if (context.body && typeof context.body === 'object' && options.mergeBody) {
            for (var p in context.body) {
                if (!context.data[p]) {
                    context.data[p] = context.body[p];
                }
            }
        }
    }
    
    context.create_token = not_implemented('create_token');
    context.create_token_url = not_implemented('create_token_url');
    
    return context;
}


function not_implemented(api) {
    return function () {
        throw new Error(`The '${api}' method is not supported in this environment`);
    };
}