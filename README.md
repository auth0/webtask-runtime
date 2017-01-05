# Webtask runtime components

A series of components that replicate the behaviour of the runtime component of https://webtask.io.

## Example

**Given a sample webtask:**

```js
function webtask(ctx, cb) {
    return cb(null, {
        secret: ctx.secrets.hello,
    });
}
```

**Sample of simulating a request to a webtask function:**

```js
const Assert = require('assert');
const Runtime = require('webtask-runtime');

Runtime.simulate(webtask, { secrets: { hello: 'world' }}, function (res) {
    Assert.ok(res.statusCode === 200);
    Assert.ok(typeof res.payload === 'string');
});
```

**Sample of creating a local http server that runs a webtask:**

```js
const Assert = require('assert');
const Runtime = require('webtask-runtime');

const server = Runtime.createServer(webtask, { secrets: { hello: 'world' }});

server.listen(8080);
```

## API

TODO

## Contributing

Just clone the repo, run `npm install` and then hack away.

## Issue reporting
 
If you have found a bug or if you have a feature request, please report them at
this repository issues section. Please do not report security vulnerabilities on
the public GitHub issue tracker. The 
[Responsible Disclosure Program](https://auth0.com/whitehat) details the 
procedure for disclosing security issues.

## License
 
MIT

## What is Auth0?
 
Auth0 helps you to:

* Add authentication with [multiple authentication sources](https://docs.auth0.com/identityproviders), either social like **Google, Facebook, Microsoft Account, LinkedIn, GitHub, Twitter, Box, Salesforce, amont others**, or enterprise identity systems like **Windows Azure AD, Google Apps, Active Directory, ADFS or any SAML Identity Provider**.
* Add authentication through more traditional **[username/password databases](https://docs.auth0.com/mysql-connection-tutorial)**.
* Add support for **[linking different user accounts](https://docs.auth0.com/link-accounts)** with the same user.
* Support for generating signed [Json Web Tokens](https://docs.auth0.com/jwt) to call your APIs and **flow the user identity** securely.
* Analytics of how, when and where users are logging in.
* Pull data from other sources and add it to the user profile, through [JavaScript rules](https://docs.auth0.com/rules).

## Create a free account in Auth0
 
1. Go to [Auth0](https://auth0.com) and click Sign Up.
2. Use Google, GitHub or Microsoft Account to login.
