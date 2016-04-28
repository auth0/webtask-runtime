'use strict';


module.exports = {
    compile: require('./lib/compiler').compile,
    createContext: require('./lib/context').create,
    createHandler: require('./lib/handler').create,
    createServer: require('./lib/server').create,
    createStorage: require('./lib/storage').create,
    simulate: require('./lib/simulator').simulate,
};
