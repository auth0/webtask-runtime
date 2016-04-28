module.exports = function (ctx, cb) {
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
};
