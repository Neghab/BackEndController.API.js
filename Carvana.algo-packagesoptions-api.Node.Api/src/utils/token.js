const crypto = require('crypto');
import {functions} from './functions';

export const getTokenHash = (token) => {
    const parsed = token.split('.')[1];
    const buffer = Buffer.from(parsed, 'base64').toString('ascii');

    const parsedJson = JSON.parse(buffer);

    const { client_id: clientId, scope } = parsedJson;

    const hash = crypto
        .createHash('md5')
        .update(`${clientId}-${scope}`)
        .digest('hex');

    return hash;
};

export const parseJWTToken = (token) => {
    if (functions.isNil(token) || functions.isEmpty(token)) return null;

    const parsed = token.access_token.split('.')[1];
    const buffer = Buffer.from(parsed, 'base64').toString('ascii');

    const { exp } = JSON.parse(buffer);

    return {
        exp,
        accessToken: token,
    };
};

export const isTokenExpired = () => {
    // const { tokenExpiresIn } = parseJWTToken(token);

    // return checkRemainingTime(tokenExpiresIn);
};


