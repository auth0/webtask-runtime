module.exports = function (ctx, req, res, bogus) {
    res.writeHead(200, {
        'content-type': 'application/json',
    });
    res.end(JSON.stringify('hello world', null, 2));
};