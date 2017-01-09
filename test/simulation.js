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
    
    lab.test('will correctly simulate a POST request with a JSON body (parseBody: false)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'echo_server.js'), 'utf8');
        const options = {
            logger,
            url: '/simulation',
            method: 'POST',
            query: { hello: 'world' },
            payload: { goodbye: 'moon' },
            secrets: { something: 'private' },
            params: { something: 'public' },
        };
        
        Runtime.simulate(code, options, (res) => {
            expect(res.statusCode).to.equal(200);
            expect(res.payload).to.be.a.string();
            
            const payload = JSON.parse(res.payload);
            
            expect(payload.url).to.equal('/simulation?hello=world');
            expect(payload.method).to.equal('POST');
            expect(payload.query).to.equal({ hello: 'world' });
            expect(payload.body).to.be.undefined(); // parseBody is false
            expect(payload.secrets).to.equal({ something: 'private' });
            expect(payload.params).to.equal({ something: 'public' });
            
            done();
        });
    });
});

if (require.main === module) {
    Lab.report([lab], { output: process.stdout, progress: 2 });
}