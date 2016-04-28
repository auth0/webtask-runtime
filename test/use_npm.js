'use strict';


const Code = require('code');
const Fs = require('fs');
const Lab = require('lab');
const Path = require('path');
const Runtime = require('../');

const lab = exports.lab = Lab.script();
const expect = Code.expect;


lab.experiment('The "use npm" directive', () => {
    
    const logger = {
        info: () => null,
        warn: () => null,
        error: () => null,
    };
    
    lab.test('will fail when the `installModule` callback is not provided', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'use_npm_bogus.js'), 'utf8');
        
        Runtime.compile(code, { logger }, (err, webtaskFunction) => {
            expect(err).to.be.an.error();
            expect(err.message).to.be.a.string().and.contain('Cannot find module \'bogus\'');
            expect(webtaskFunction).to.be.undefined();
            
            done();
        });
    });
    
    lab.test('will cause the `installModule` callback to be invoked', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'use_npm_bogus.js'), 'utf8');
        const installed = [];
        const installModule = (spec, cb) => {
            installed.push(spec);
            
            cb();
        };
        
        Runtime.compile(code, { installModule, logger }, (err, webtaskFunction) => {
            expect(err).to.be.an.error();
            expect(err.message).to.be.a.string().and.contain('Cannot find module \'bogus\'');
            expect(webtaskFunction).to.be.undefined();
            expect(installed).to.be.an.array().and.contain('bogus');
            
            done();
        });
    });
});