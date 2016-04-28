'use strict';

const Async = require('async');
const Path = require('path');
const _ = require('lodash');


module.exports = {
    compile,
};


const RX_USE_DIRECTIVE = /^(?:[\n\s]*(\"|\')use\s+(latest|npm)\1\s*(?:;|\n))*/g;


/**
 * Complied a supplied webtask function's code, returning the webtask function.
 * 
 * @param {String} script - The webtask code to be compiled.
 * @param {Object} [options] - Options object.
 * @param {String} [options.dirname] - The directory name relative to which the supplied webtask code will appear to run.
 * @param {String} [options.filename] - The filename under which the webtask code will appear to run.
 * @param {Object} [options.logger] - The logger object to use. This object is expected to expose standard log functions (`info`, `warn` and `error`).
 * @param {Function} [options.installModule] - A function that will be called for each missing module when the `"use npm"` directive is used.
 * @param {Function} cb - The node-style callback with a signature of `function (err, webtaskFunction)`.
 */
function compile(code, options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }

    options = _.defaults({}, options, {
        dirname: process.cwd(),
        filename: 'webtask.js',
        logger: console,
        installModule: (spec, cb) => cb(new Error(`The code being compiled uses the "use npm" directive and the required module '${spec}' is not available but no 'installModule' function was provided.`)),
        extraModulePaths: [],
    });

    const logger = options.logger;
    const matches = code.match(RX_USE_DIRECTIVE);
    const use_latest = matches && matches[0].indexOf('latest') > 0;
    const use_npm = matches && matches[0].indexOf('npm') > 0;
    const pathname = Path.join(options.dirname, options.filename);

    // Check for UTF-8 BOM
    if (code.charCodeAt(0) === 0xFEFF) {
        code = code.slice(1);
    }

    if (use_latest) {
        try {
            code = require('babel').transform(code, { ast: false, loose: 'all' }).code;
        } catch (e) {
            const error = new Error(`Failed to compile code with "use latest" directive: ${e.toString()}`);
            
            error.code = 400;
            error.origin = e;
            
            return cb(error);
        }
    }

    const missing = [];

    if (use_npm) {
        const detective = require('detective');
        const wanted = detective(code);

        wanted.forEach(spec => {
            // Skip over absolute and relative paths
            if (spec[0] === '.' || spec[0] === '/') return;

            try {
                require(spec);
            } catch (__) {
                missing.push(spec);
            }
        });
    }

    return Async.waterfall([
        (next) => {
            if (!missing.length) return next();
            
            logger.info('Your code requires the following modules that are not currently available: [' + missing.join(', ') + '].');
            logger.info('Requiring modules that are not natively supported by the webtask platform will incur additional latency each time a new container is used. If you require low-latency and custom modules, we offer a managed webtask cluster option where you can customize the set of installed modules. Please contact us at support@webtask.io to discuss.');
            logger.info();
            logger.info('Installing: [' + missing.join(', ') + '] please wait...');
            logger.info();
    
            Async.map(missing, options.installModule, (err) => {
                if (err) {
                    logger.warn('An error was encountered while trying to install missing modules: ' + err.message);
                    logger.warn('Attempting to run the webtask anyway...');
                    logger.warn();
                }
    
                next();
            });
        },
        (next) => {
            const Module = require('module');
            const mod = new Module(pathname, module);
            let func;

            // Normally done as a part of Module#load
            mod.filename = pathname;
            mod.paths = module.constructor._nodeModulePaths(options.dirname)
                .concat(options.extraModulePaths);

            // Module#_compile will return the result of executing the code
            // which will be our function if the `return function () {}` syntax
            // is used.
            // Otherwise, we can look at `module.exports`.
            try {
                func = mod._compile(code, pathname) || mod.exports;
                
                mod.loaded = true;
            } catch (e) {
                if (e.message.indexOf('SyntaxError') === 0) {
                    console.log(code);
                    console.log(e.stack);
                }
                const error = new Error(`Unable to compile submitted JavaScript: ${e.toString()}`);
                
                error.code = 400;
                error.origin = e;
                
                return next(error);
            }
            
            return next(null, func);
        },
        (webtaskFunction, next) => {
            let error;
            
            if (typeof webtaskFunction !== 'function') {
                error = new Error('Supplied code must return or export a function.');
            } else if (webtaskFunction.length > 3 || webtaskFunction.length < 1) {
               error = new Error('The JavaScript function must have one of the following signatures: ([ctx], callback) or (ctx, req, res).');
            }
            
            if (error) {
                error.code = 400;
                
                return next(error);
            }
            
            next(null, webtaskFunction);
        }
    ], cb);
}