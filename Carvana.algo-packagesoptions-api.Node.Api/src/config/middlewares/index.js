const splunkMiddleware = require('./splunk');

export default (config) => {
    const { splunk, generateID } = config;

    const _splunkMiddlware = splunkMiddleware.default(splunk)
    return {
        splunk: _splunkMiddlware,
        authError: (err, _, res, next) => {
            if (err.name === 'UnauthorizedError') {
                res.status(401).send({
                    message: `JWT Validation Error ::: ${err.name}`,
                    errro: err.message,
                    code: err.code,
                    status: err.status,
                });
            }

            next(err);
        },
        requestSetup: (req, _, next) => {
            req.requestId = generateID();
            req.correlationContextId = generateID();
            req.requestTimestamp = new Date().getTime()
            next();
        }
    }
};
