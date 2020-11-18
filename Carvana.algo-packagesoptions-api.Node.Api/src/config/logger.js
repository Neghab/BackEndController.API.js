import { Logger } from 'splunk-logging';
import {envVariables as environmentVariables} from './env.variables';
import stringify from 'json-stringify-safe';

const {splunkToken, splunkURL} = environmentVariables;

const serverSystemName = 'AlgoContent_PackagesOptionsAPI';

export const splunkLogger = new Logger({
  token: `${splunkToken}`,
  url: `${splunkURL}`,
  port: 443
});

export const sendSplunkLog = logDetail => {
  const {logMessage, status, responseBody, query} = logDetail;

  splunkLogger && splunkLogger.send({
    message: {
      msg: `${serverSystemName} - ${logMessage}`,
      serverName: serverSystemName,
      status,
      responseBody,
      query: stringify(query)
    }
  });
};


export const sendSplunkLogMessage = logMessage => {
  splunkLogger.send({
    message: {
      msg: `${serverSystemName} - ${logMessage}`,
      serverName: serverSystemName,
    }
  });
};

export const logAndReturn = (logMessage, res, status, responseBody, query) => {
  sendSplunkLog({logMessage, status, responseBody, query});
  return res.status(status).json(responseBody);
}
