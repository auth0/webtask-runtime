'use strict';


const Code = require('code');
const Fs = require('fs');
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
    let server;

    lab.afterEach(done => {
        server && server.listening
            ?   server.close(done)
            :   done();
    });

    lab.test('will run an exported webtask (1-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_1.js'), 'utf8');
        server = Runtime.createServer(code, { logger });

        server.listen(3001);

        Request.get('http://localhost:3001', { json: false }, (err, res, body) => {
            server.close(done);

            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.equal('"hello world"');
        });
    });

    lab.test('will run an exported webtask (2-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_2.js'), 'utf8');
        server = Runtime.createServer(code, { logger });

        server.listen(3001);

        Request.get('http://localhost:3001', { json: false }, (err, res, body) => {
            server.close(done);

            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.equal('"hello world"');
        });
    });

    lab.test('will run an exported webtask (3-argument)', done => {
        const code = Fs.readFileSync(Path.join(__dirname, '..', 'fixtures', 'exports_hello_world_3.js'), 'utf8');
        server = Runtime.createServer(code, { logger });

        server.listen(3001);

        Request.get('http://localhost:3001', { json: false }, (err, res, body) => {
            server.close(done);

            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.equal('"hello world"');
        });
    });

    lab.test('supports the module.webtask api when serving webtasks', done => {
        const code = `
            const secrets = module.webtask.secrets;

            module.exports = (cb) => cb(null, { secrets });
        `;
        const secrets = { key: 'value' };
        server = Runtime.createServer(code, { logger, secrets });

        server.listen(3001);

        Request.get('http://localhost:3001', { json: false }, (err, res, body) => {
            server.close(done);

            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.equal(JSON.stringify({ secrets }));
        });
    });

    lab.test('will only run a webtask once per request', done => {
        let count = 0;

        const webtaskFn = (cb) => { count++; console.log('run'); cb(null, count); };
        server = Runtime.createServer(webtaskFn, { logger });

        server.listen(3001);

        Request.get('http://localhost:3001', { json: false }, (err, res, body) => {
            server.close(done);

            expect(err).to.be.null();
            expect(res.statusCode).to.equal(200);
            expect(body).to.equal("1");
            expect(count).to.equal(1);
        });
    });
});

if (require.main === module) {
    Lab.report([lab], { output: process.stdout, progress: 2 });
}
