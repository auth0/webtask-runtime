'use strict';


module.exports = {
    create,
};


function create(code, description, source) {
    const error = new Error();
    
    error.code = code;
    error.error = description;
    error.details = source instanceof Error ? source.toString() : source;
    error.name = source.name;
    error.message = source.message;
    error.stack = source.stack;
        
    return error;
}
