'use strict';


const Code = require('code');
const Fs = require('fs');
const Lab = require('lab');
const Path = require('path');
const Runtime = require('../');

const lab = exports.lab = Lab.script();
const expect = Code.expect;


lab.experiment('Simulation of mock requests', () => {
    
    const logger = {
        info: () => null,
        warn: () => null,
        error: () => null,
    };
    
    lab.test('will execute basic requests (1 argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_1.js'), 'utf8');
        
        Runtime.simulate(code, { logger }, (res) => {
            expect(res.statusCode).to.equal(200);
            expect(res.payload).to.equal('"hello world"');
            
            done();
        });
    });
    
    lab.test('will execute basic requests (2 argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_2.js'), 'utf8');
        
        Runtime.simulate(code, { logger }, (res) => {
            expect(res.statusCode).to.equal(200);
            expect(res.payload).to.equal('"hello world"');
            
            done();
        });
    });
    
    lab.test('will execute basic requests (3 argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_3.js'), 'utf8');
        
        Runtime.simulate(code, { logger }, (res) => {
            expect(res.statusCode).to.equal(200);
            expect(res.payload).to.equal('"hello world"');
            
            done();
        });
    });
});