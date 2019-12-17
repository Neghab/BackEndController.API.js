import { Logger } from 'splunk-logging';
import config from '../config/config';

const {CARVANA_APP_SPLUNK_TOKEN, CARVANA_APP_SPLUNK_URL} = config;

const serverSystemName = 'AlgoContent_PackagesOptionsAPI';
export const splunkLogger = (typeof(CARVANA_APP_SPLUNK_TOKEN) ==='string' && CARVANA_APP_SPLUNK_TOKEN.length >0) && new Logger({
  token: `${CARVANA_APP_SPLUNK_TOKEN}`,
  url: `${CARVANA_APP_SPLUNK_URL}`,
  port: 443
});

export const sendSplunkLog = logDetail => {
  const {logMessage, status, responseBody, query} = logDetail;
  
  if(splunkLogger !== false){
    splunkLogger.send({
      message: {
        msg: `${serverSystemName} - ${logMessage}`,
        serverName: serverSystemName,
        status,
        responseBody,
        query: JSON.stringify(query)
      }
    });
  }
}


export const logAndReturn = (logMessage, res, status, responseBody, query) => {
  sendSplunkLog({logMessage, status, responseBody, query});
  return res.status(status).json(responseBody);
}
