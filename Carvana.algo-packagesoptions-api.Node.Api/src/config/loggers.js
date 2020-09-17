import {functions} from '../utils';

const chalk = require('chalk');

const winston = require('winston');

const { format: { combine, colorize, timestamp, align, printf } } = winston;

const initializeCLILogger = () => {
    const { trim } = functions;

    // eslint-disable-next-line no-shadow
    const applicationLogFormat = printf(({ level, message, timestamp }) => {
        return `${chalk.white(trim(level))}: ${chalk.blue.bgGreen(chalk.white(trim(timestamp)))}--${chalk.blue.bgRed(chalk.white(trim(message)))}`;
    });

    const logger = winston.createLogger({
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            new winston.transports.Console({
                format: combine(colorize(),
                    timestamp(),
                    align(),
                    applicationLogFormat
                )
            })
        ]
    });

    return logger;
}

const _logCLIMessage = (logger, payload) => {
    logger.log({ level: payload.level, message: payload.message });
};

export const configureLoggers = (config = {}) => {
    const _cliLogger = initializeCLILogger()

    return {
        applicationLogger: payload => _logCLIMessage(_cliLogger, payload),
        // more logger transports to be exposed here
    }

}

