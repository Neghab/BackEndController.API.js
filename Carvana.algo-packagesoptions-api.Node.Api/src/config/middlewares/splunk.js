const R = require('ramda')
const Promise = require('bluebird');
const stackTrace = require('stack-trace');
const SplunkLogger = require('splunk-logging').Logger;

const { isNil, isEmpty, compose } = R;

const getLoggerInstance = config => {
    const logger = new SplunkLogger({
        token: config.splunkToken,
        url: config.splunkURL,
        protocol: 'https',
        port: 443,
    });

    return logger;
}

const getLogLevel = config => {
    const { requestDetails: { err: { status } } } = config;
    let level = 'debug';

    // *! default level to debug if incorrect level is passed
    if (status >= 100) {
        level = 'info';
    }
    if (status >= 400) {
        level = 'error';
    }

    return {
        ...config,
        envelope: {
            ...config.envelope,
            level
        }
    }
};

const getLogMessage = (config = {}) => {
    const { requestDetails: { err: { status, message } } } = config;
    let eventMessage = '';

    switch (status) {
        case 401:
            eventMessage = 'UnauthorizedError';
            break;
        default:
            eventMessage = message;
            break;
    }

    return {
        ...config,
        envelope: {
            ...config.envelope,
            message: eventMessage
        }
    }
};

const getTemplate = config => ({
    ...config,
    envelope: {
        ...config.envelope,
        level: null,
        message: '',
        exception: '',
        properties: {},
        time: new Date().getTime()
    }
});

const getHeaderTemplate = headers => {
    if (isNil(headers) || isEmpty(headers)) return {};
    const { authorization, ...restOfHeaders } = headers;
    return restOfHeaders;
};

const getRequestTemplate = config => {
    const { requestDetails: { req } } = config;

    const {
        method,
        hostname,
        requestId,
        originalUrl,
        requestTimestamp,
        correlationContextId
    } = req;

    return {
        ...config,
        envelope: {
            ...config.envelope,
            time: requestTimestamp,
            properties: {
                method,
                hostname,
                requestId,
                originalUrl,
                correlationContext: correlationContextId,
                processId: process.pid,
                threadId: 0
            }
        }
    }
}


const getTraceTemplate = config => {
    const { requestDetails: { err } } = config;

    const trace = isNil(err) || isEmpty(err) ?
        stackTrace.get() :
        stackTrace.parse(err);

    return {
        ...config,
        envelope: {
            ...config.envelope,
            properties: {
                ...config.envelope.properties,
                stackTrace: trace.map(site => ({
                    file: site.getFileName(),
                    function: site.getFunctionName(),
                    line: site.getLineNumber()
                }))
            }
        }
    }
};

const getErrorTemplate = (config = {}) => {
    const { requestDetails: { err } } = config;

    return {
        ...config,
        envelope: {
            ...config.envelope,
            exception: [err.stack].join('\n'),
        }
    };
};

const WITH_ERROR_ENVELOPE = compose(getErrorTemplate, getTraceTemplate, getLogMessage, getLogLevel, getHeaderTemplate, getRequestTemplate, getTemplate);

export default (config = {}) => {

    const logger = getLoggerInstance(config);

    return async (err, req, res, next) => {

        const _config = {
            envelope: {},
            splunkConfig: { ...config },
            requestDetails: { err, req, res }
        }

        const { envelope } = WITH_ERROR_ENVELOPE(_config)

        logger.send({
            message: { ...envelope },
            metadata: {
                source: 'Carvana Node Template',
                sourcetype: 'Carvana Node Template Splunk Logger',
            },
            severity: envelope.level
        });
        next(err)
    };
}
