'use strict';


module.exports = {
    compile: require('./lib/compiler').compile,
    createContext: require('./lib/context').create,
    createHandler: require('./lib/handler').create,
    createStorage: require('./lib/storage').create,
    simulate: require('./lib/simulator').simulate,
};
