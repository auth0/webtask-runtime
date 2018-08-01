'use strict';

const Crypto = require('crypto');
const Fs = require('fs');


module.exports = {
    create,
};

class Storage {
    constructor(initialData, runtimeOptions) {
        this._data = undefined;
        this._etag = undefined;

        if (!initialData && runtimeOptions && runtimeOptions.storageFile) {
            this._storageFile = runtimeOptions.storageFile;

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
            this.set(initialData, {
                force: true,
            }, function noop() {});
        }
    }

    get data() {
        return this._data;
    }

    get etag() {
        return this._etag;
    }

    get(options, cb) {
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

        if (typeof this._data === 'undefined') {
            // Signal that the initial read has been done
            this._etag = null;
        }

        cb(null, this._data);
    }

    set(data, options, cb) {
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

        if (data !== undefined && data !== null && this._etag === undefined && !options.force) {
            throw new Error('When calling storage.set without having called storage.get before, you must specify the .force option.');
        }

        if (data === undefined || data === null) {
            this._data = undefined;
            this._etag = undefined;
        }
        else {
            if (options.etag !== undefined) {
                if (options.etag === null && typeof this._data !== 'undefined' || options.etag !== null && this._etag !== options.etag) {
                    const err = new Error('Item was modified since it was read.');
                    err.conflict = this._data;
                    return cb && cb(err);
                }
            }

            // TODO: Under what conditions is options.create_etag *NOT* set?
            this._data = data;
            this._etag = Crypto.createHash('md5').update(JSON.stringify(data)).digest('base64');
        }

        if (this._storageFile) {
            return Fs.writeFile(this._storageFile, JSON.stringify(this._data, null, 2), function (err) {
                if (err) {
                    return cb && cb(err);
                }

                return cb && cb();
            });
        }

        return cb && cb();
    }
}

function create(initialData, runtimeOptions) {
    return new Storage(initialData, runtimeOptions);
}
