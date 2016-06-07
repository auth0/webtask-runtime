'use strict';


const Code = require('code');
const Fs = require('fs');
const Lab = require('lab');
const Path = require('path');
const Runtime = require('../');

const lab = exports.lab = Lab.script();
const expect = Code.expect;


lab.experiment('Webtask compilation', () => {
    
    lab.test('will compile an exported webtask (1-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_1.js'), 'utf8');
        
        Runtime.compile(code, (err, webtaskFunction) => {
            expect(err).to.be.null();
            expect(webtaskFunction).to.be.a.function();
            expect(webtaskFunction.length).to.equal(1);
            
            done();
        });
    });
    
    lab.test('will compile an exported webtask (2-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_2.js'), 'utf8');
        
        Runtime.compile(code, (err, webtaskFunction) => {
            expect(err).to.be.null();
            expect(webtaskFunction).to.be.a.function();
            expect(webtaskFunction.length).to.equal(2);
            
            done();
        });
    });
    
    lab.test('will compile an exported webtask (3-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_3.js'), 'utf8');
        
        Runtime.compile(code, (err, webtaskFunction) => {
            expect(err).to.be.null();
            expect(webtaskFunction).to.be.a.function();
            expect(webtaskFunction.length).to.equal(3);
            
            done();
        });
    });
    
    lab.test('will fail to compile an exported webtask (4-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_4.js'), 'utf8');
        
        Runtime.compile(code, (err, webtaskFunction) => {
            expect(err).to.be.an.error();
            expect(err.message).to.be.a.string().and.contain('The JavaScript function must have one of the following signatures');
            expect(webtaskFunction).to.be.undefined();
            
            done();
        });
    });
    
    lab.test('will compile a returned webtask function (1-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'returns_hello_world_1.js'), 'utf8');
        
        Runtime.compile(code, (err, webtaskFunction) => {
            expect(err).to.be.null();
            expect(webtaskFunction).to.be.a.function();
            expect(webtaskFunction.length).to.equal(1);
            
            done();
        });
    });
    
    lab.test('will compile a returned webtask function (2-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'returns_hello_world_2.js'), 'utf8');
        
        Runtime.compile(code, (err, webtaskFunction) => {
            expect(err).to.be.null();
            expect(webtaskFunction).to.be.a.function();
            expect(webtaskFunction.length).to.equal(2);
            
            done();
        });
    });
    
    lab.test('will compile a returned webtask function (3-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'returns_hello_world_3.js'), 'utf8');
        
        Runtime.compile(code, (err, webtaskFunction) => {
            expect(err).to.be.null();
            expect(webtaskFunction).to.be.a.function();
            expect(webtaskFunction.length).to.equal(3);
            
            done();
        });
    });
    
    lab.test('will fail to compile a webtask exporting junk', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_junk.js'), 'utf8');
        
        Runtime.compile(code, (err, webtaskFunction) => {
            expect(err).to.be.an.error();
            expect(err.message).to.be.a.string().and.contain('Supplied code must return or export a function');
            expect(webtaskFunction).to.be.undefined();
            
            done();
        });
    });
    
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
            const requested = [];
            const installModules = (specs, cb) => {
                requested.push.apply(requested, specs);
                
                cb();
            };
            
            Runtime.compile(code, { installModules, logger }, (err, webtaskFunction) => {
                expect(err).to.be.an.error();
                expect(err.message).to.be.a.string().and.contain('Cannot find module \'bogus\'');
                expect(webtaskFunction).to.be.undefined();
                expect(requested).to.be.an.array().and.contain('bogus');
                
                done();
            });
        });
        
        lab.test('will not invoke the `installModule` callback if the directive is modified', done => {
            const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'use_npm_bogus.js'), 'utf8')
                .replace('"use npm"', '"use astrology"');
            const requested = [];
            const installModule = (spec, cb) => {
                requested.push(spec);
                
                cb();
            };
            
            Runtime.compile(code, { installModule, logger }, (err, webtaskFunction) => {
                expect(err).to.be.an.error();
                expect(err.message).to.be.a.string().and.contain('Cannot find module \'bogus\'');
                expect(webtaskFunction).to.be.undefined();
                expect(requested).to.be.an.array().and.be.empty();
                
                done();
            });
        });
        
        lab.test('will rewrite the source code for version-specific requires', done => {
            const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'use_npm_with_version.js'), 'utf8');
            const requested = [];
            const installModules = (specs, cb) => {
                requested.push.apply(requested, specs);
                
                cb();
            };
            
            Runtime.compile(code, { installModules, logger }, (err, webtaskFunction) => {
                expect(err).to.be.an.error();
                expect(err.message).to.be.a.string().and.contain('Cannot find module \'bogus\'');
                expect(webtaskFunction).to.be.undefined();
                expect(requested).to.be.an.array().and.contain('bogus@1.0.0');
                
                done();
            });
        });
    });
});

if (require.main === module) {
    Lab.report([lab], { output: process.stdout, progress: 2 });
}