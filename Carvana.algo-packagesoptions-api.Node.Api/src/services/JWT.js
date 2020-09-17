const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const jsonwebtoken = require('jsonwebtoken');

export const JWT = config => jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 1000,
        jwksUri: `${config.authServerUrl}/identity/.well-known/jwks`,
    }),
    iss: config.authIssuer,
    aud: config.authAudiance,
    algorithms: ['RS256'],
});


export const tokenValidationError = (err, req, res) => {
    res.status(401).send({
        message: `JWT Validation Error ::: ${err.name}`,
        errro: err.message,
        code: err.code,
        status: err.status,
    });
};

export const decodeJWT = token => {
    try {
        return jsonwebtoken.decode(token, { complete: false });
    } catch (e) {
        console.log(e);
        return null;
    }
};

export const isJWTExpired = timestamp => Date.now() >= timestamp;

export default {
    JWT,
    decodeJWT,
    isJWTExpired,
    verifyJWT: {},
    tokenValidationError,
};
