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


lab.experiment('Storage APIs', () => {
    
    const logger = {
        info: () => null,
        warn: () => null,
        error: () => null,
    };
    const storage = Runtime.createStorage();
    let server;
    
    lab.afterEach(done => {
        server && server.listening
            ?   server.close(done)
            :   done();
    });
    
    lab.test('will start with undefined value and undefined etag', { timeout: 0 }, done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'storage_set_query.js'), 'utf8');
        
        server = Runtime.createServer(storageSetQuery, { logger, storage });
        
        server.listen(3001);
        
        Request.get('http://localhost:3001', { json: true, qs: { store: 'this' } }, (err, res, body) => {
            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.be.an.object();
            expect(body.initialEtag).to.be.undefined();
            expect(body.afterReadEtag).to.be.null();
            expect(body.etag).to.be.a.string();
            expect(body.data).to.be.undefined();
            expect(body.initialEtag).to.not.equal(body.afterReadEtag);
            expect(body.afterReadEtag).to.not.equal(body.etag);
            
            const afterWriteEtag = body.etag;
            
            Request.get('http://localhost:3001', { json: true }, (err, res, body) => {
                expect(err).to.be.null();
                expect(res.statusCode).to.equal(200);
                expect(body).to.be.an.object();
                expect(body.initialEtag).to.be.a.string().and.to.equal(afterWriteEtag);
                expect(body.afterReadEtag).to.be.a.string().and.to.equal(afterWriteEtag);
                expect(body.etag).to.not.equal(body.initialEtag);
                
                expect(body.data).to.deep.equal({ store: 'this' });
                
                server.close(done);
            });
        });
        
        function storageSetQuery(ctx, cb) {
            const initialEtag = ctx.storage.etag;
            
            ctx.storage.get((err, data) => {
                if (err) return cb(err);
                
                const afterReadEtag = ctx.storage.etag;
                
                ctx.storage.set(ctx.query, err => {
                    if (err) return cb(err);
                    
                    cb(null, {
                        data,
                        etag: ctx.storage.etag,
                        initialEtag,
                        afterReadEtag,
                    });
                });
                
                // Set storage after the request is sent
            });
        }
    });
});

if (require.main === module) {
    Lab.report([lab], { output: process.stdout, progress: 2 });
}