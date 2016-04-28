'use strict';


const Code = require('code');
const Fs = require('fs');
const Http = require('http');
const Lab = require('lab');
const Path = require('path');
const Request = require('request');
const Runtime = require('../');

const lab = exports.lab = Lab.script();
const expect = Code.expect;


lab.experiment('Local webtask server', () => {
    
    const logger = {
        info: () => null,
        warn: () => null,
        error: () => null,
    };
    
    lab.test('will run an exported webtask (1-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_1.js'), 'utf8');
        const server = Runtime.createServer(code, logger);
        
        server.listen(3001);
        
        Request.get('http://localhost:3001', { json: false }, (err, res, body) => {
            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.equal('"hello world"');
            
            server.close(done);
        });
    });
    
    lab.test('will run an exported webtask (2-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_2.js'), 'utf8');
        const server = Runtime.createServer(code, logger);
        
        server.listen(3001);
        
        Request.get('http://localhost:3001', { json: false }, (err, res, body) => {
            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.equal('"hello world"');
            
            server.close(done);
        });
    });
    
    lab.test('will run an exported webtask (3-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_3.js'), 'utf8');
        const server = Runtime.createServer(code, logger);
        
        server.listen(3001);
        
        Request.get('http://localhost:3001', { json: false }, (err, res, body) => {
            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.equal('"hello world"');
            
            server.close(done);
        });
    });
});