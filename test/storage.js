'use strict';


const Code = require('code');
const Fs = require('fs');
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

    let server;

    lab.afterEach(done => {
        Fs.writeFileSync(Path.join(__dirname, '../fixtures/data_clicks.json'), JSON.stringify({
            "foo": "bar",
            "totalClicks": 12345
        }, null, 2), 'utf8');

        server && server.listening
            ?   server.close(done)
            :   done();
    });

    lab.test('will start with undefined value and undefined etag', { timeout: 0 }, done => {
        server = Runtime.createServer(storageSetQuery, { logger });

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

    lab.test('will not throw if storageFile is not found', { timeout: 0 }, done => {
        server = Runtime.createServer(storageSetQuery, { logger, storageFile: './foo/bar' });

        server.listen(3001);

        Request.get('http://localhost:3001', { json: true }, (err, res, body) => {
            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.be.an.object();
            expect(body.data).to.be.undefined();
            server.close(done);
        });

        function storageSetQuery(ctx, cb) {
            ctx.storage.get((err, data) => {
                if (err) return cb(err);

                cb(null, {
                  data
                });
            });
        }
    });

    lab.test('will not use storageFile if initialData is set', { timeout: 0 }, done => {
        server = Runtime.createServer(storageGetQuery, { logger, initialStorageData: { a: 'b' }, storageFile: Path.join(__dirname, '../fixtures/data_dummy.json') });

        server.listen(3001);

        Request.get('http://localhost:3001', { json: true }, (err, res, body) => {
            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.be.an.object();
            expect(body.data).to.be.an.object();
            expect(body.data.a).to.equal("b");
            server.close(done);
        });

        function storageGetQuery(ctx, cb) {
            ctx.storage.get((err, data) => {
                if (err) return cb(err);

                cb(null, {
                  data
                });
            });
        }
    });

    lab.test('will use the storageFile to load the initial data', { timeout: 0 }, done => {
        server = Runtime.createServer(storageGetQuery, { logger, storageFile: Path.join(__dirname, '../fixtures/data_clicks.json') });

        server.listen(3001);

        Request.get('http://localhost:3001', { json: true }, (err, res, body) => {
            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.be.an.object();
            expect(body.data).to.be.an.object();
            expect(body.data.foo).to.equal("bar");
            expect(body.data.totalClicks).to.equal(12345);
            server.close(done);
        });

        function storageGetQuery(ctx, cb) {
            ctx.storage.get((err, data) => {
                if (err) return cb(err);

                cb(null, {
                  data
                });
            });
        }
    });

    lab.test('will persist data to the storageFile', { timeout: 0 }, done => {
        server = Runtime.createServer(storageSetQuery, { logger, storageFile: Path.join(__dirname, '../fixtures/data_clicks.json') });
        server.listen(3001);

        Request.get('http://localhost:3001', { json: true, qs: { totalClicks: 20000 } }, (err, res, body) => {
            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.be.an.object();
            expect(body.data).to.be.an.object();
            expect(body.data.foo).to.equal("bar");
            expect(body.data.totalClicks).to.equal(12345);

            Request.get('http://localhost:3001', { json: true }, (err, res, body) => {
                expect(err).to.be.null();
                expect(res.statusCode).to.equal(200);
                expect(body).to.be.an.object();
                expect(body.data).to.be.an.object();
                expect(body.data.foo).to.equal("bar");
                expect(body.data.totalClicks).to.equal(20000);

                const dataFile = JSON.parse(Fs.readFileSync(Path.join(__dirname, '../fixtures/data_clicks.json'), 'utf8'));
                expect(dataFile.totalClicks).to.equal(20000);

                server.close(done);
            });
        });

        function storageSetQuery(ctx, cb) {
            ctx.storage.get((err, data) => {
                if (err) return cb(err);

                if (!ctx.query || !ctx.query.totalClicks) {
                  return cb(null, {
                    data
                  });
                }

                const update = { foo: data.foo, totalClicks: parseInt(ctx.query.totalClicks, 10) };
                ctx.storage.set(update, err => {
                    if (err) return cb(err);

                    cb(null, {
                        data
                    });
                });
            });
        }
    });
});

if (require.main === module) {
    Lab.report([lab], { output: process.stdout, progress: 2 });
}
