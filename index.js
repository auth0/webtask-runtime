'use strict';


const Compiler = require('./lib/compiler');
const Context = require('./lib/context');
const Errors = require('./lib/errors');
const Handler = require('./lib/handler');
const Request = require('./lib/request');
const Runner = require('./lib/runner');
const Server = require('./lib/server');
const Simulator = require('./lib/simulator');
const Storage = require('./lib/storage');


module.exports = {
    compile: Compiler.compile,
    createContext: Context.create,
    createError: Errors.create,
    createHandler: Handler.create,
    createServer: Server.create,
    createStorage: Storage.create,
    ensureRequestConsumed: Request.ensureRequestConsumed,
    readBody: Request.readBody,
    prepareRequest: Request.prepareRequest,
    runWebtaskFunction: Runner.run,
    simulate: Simulator.simulate,
    installEndListener: Request.installEndListener,
    PARSE_NEVER: 0,
    PARSE_ALWAYS: 1,
    PARSE_ON_ARITY: 2,
};
