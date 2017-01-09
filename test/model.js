'use strict';


const Code = require('code');
const Lab = require('lab');
const Runtime = require('../');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Sandbox programming model', () => {
    
    const logger = {
        info: () => null,
        warn: () => null,
        error: () => null,
    };
    
    it('will correctly respond to webtask_pb=1 in the query parameters', done => {
        const code = (ctx, cb) => cb(null, ctx.body);
        const payload = { hello: 'world' };
        
        Runtime.simulate(code, { logger, parseBody: true, payload, method: 'POST' }, (res) => {
            expect(res.statusCode).to.equal(200);
            expect(res.payload).to.be.a.string();
            
            const json = JSON.parse(res.payload);
            
            expect(json).to.equal({ hello: 'world' });
            
            done();
        });
    });
    
    it('fails with malformed javascript', done => {
        const code = 'malformed javascript';
        
        Runtime.simulate(code, { logger }, (res) => {
            expect(res.statusCode).to.equal(400);
            expect(res.payload).to.be.a.string().and.contain('Unable to compile submitted JavaScript');
            
            done();
        });
    });
    
    it('fails with requests that are too large', done => {
        const code = (ctx, cb) => cb(null, ctx.raw_body);
        const maxBodySize = 100;
        const payload = '0'.repeat(500 * 1024);
        
        Runtime.simulate(code, { logger, maxBodySize, parseBody: true, payload, method: 'POST' }, (res) => {
            expect(res.statusCode).to.equal(400);
            expect(res.payload).to.be.a.string().and.contain('Script exceeds the size limit');
            
            done();
        });
    });
});

if (require.main === module) {
    Lab.report([lab], { output: process.stdout, progress: 2 });
}