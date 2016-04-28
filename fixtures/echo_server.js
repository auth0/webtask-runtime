module.exports = function (ctx, req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        secrets: ctx.secrets,
        params: ctx.params,
    }, null, 2));
};