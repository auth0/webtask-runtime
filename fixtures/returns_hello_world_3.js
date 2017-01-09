return function (ctx, req, res) {
    res.writeHead(200, {
        'content-type': 'application/json',
    });
    res.end(JSON.stringify('hello world', null, 2));
};