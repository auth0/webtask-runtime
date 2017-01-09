'use strict';

const Crypto = require('crypto');
const Fs = require('fs');


module.exports = {
    create,
};


function create(initialData, runtimeOptions) {
    const storage = {
        data: undefined,
        etag: undefined,
        get: get,
        set: set
    };

    if (!initialData && runtimeOptions && runtimeOptions.storageFile) {
        try  {
            if (Fs.statSync(runtimeOptions.storageFile).isFile()) {
                initialData = JSON.parse(Fs.readFileSync(runtimeOptions.storageFile, 'utf8'));
            }
        } catch (e) {
            // File does not exist.
        }
    }

    if (initialData) {
        // The noop must be passed otherwise set will assume that that 2nd argument is the cb
        set(initialData, {
            force: true,
        }, function noop() {});
    }

    return storage;


    function get(options, cb) {
        if (!cb) {
            cb = options;
            options = {};
        }

        if (typeof cb !== 'function') {
            throw new Error('Callback must be a function.');
        }

        if (typeof options !== 'object') {
            throw new Error('Options must be an object.');
        }

        if (typeof storage.data === 'undefined') {
            // Signal that the initial read has been done
            storage.etag = null;
        }

        cb(null, storage.data);
    }

    function set(data, options, cb) {
        if (!cb) {
            cb = options;
            options = {};
        }

        if (cb && typeof cb !== 'function') {
            throw new Error('Callback must be a function.');
        }

        if (typeof options !== 'object') {
            throw new Error('Options must be an object.');
        }

        if (data !== undefined && data !== null && storage.etag === undefined && !options.force) {
            throw new Error('When calling storage.set without having called storage.get before, you must specify the .force option.');
        }

        if (data === undefined || data === null) {
            storage.data = undefined;
            storage.etag = undefined;
        }
        else {
            if (options.etag !== undefined) {
                if (options.etag === null && typeof storage.data !== 'undefined' || options.etag !== null && storage.etag !== options.etag) {
                    const err = new Error('Item was modified since it was read.');
                    err.conflict = storage.data;
                    return cb && cb(err);
                }
            }

            // TODO: Under what conditions is options.create_etag *NOT* set?
            // See: https://github.com/auth0/webtask/blob/master/lib/proxy/default_store_data_handler.js#L38-L52
            storage.data = data;
            storage.etag = Crypto.createHash('md5').update(JSON.stringify(data)).digest('base64');
        }

        if (runtimeOptions.storageFile) {
            return Fs.writeFile(runtimeOptions.storageFile, JSON.stringify(storage.data, null, 2), function (err) {
                if (err) {
                    return cb && cb(err);
                }

                return cb && cb();
            });
        }

        return cb && cb();
    }
}
