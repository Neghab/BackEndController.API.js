const { NODE_ENV } = process.env;
const dotenv = require('dotenv').config({ path: `src/.env.${NODE_ENV}` })
const environmentVariables = Object.keys(dotenv.parsed).reduce((env, key) => {
    env[key] = dotenv.parsed[key];
    return env;
}, {})
console.log(environmentVariables);

const {
    // splunk
    SPLUNK_TOKEN,
    SPLUNK_INDEX,
    SPLUNK_LOG_LEVEL,
    SPLUNK_URL,

    AUTH_SERVER_URL,
    AUTH_ISS,
    AUTH_SCOPE,
    AUTH_AUD,

    ENCRYPTED_SAMPLE,
    PORT,

    // appdynamics
    APPDYNAMICS_CONTROLLER_HOST_NAME,
    APPDYNAMICS_CONTROLLER_PORT,
    APPDYNAMICS_CONTROLLER_SSL_ENABLED,
    APPDYNAMICS_AGENT_ACCOUNT_NAME,
    APPDYNAMICS_AGENT_ACCOUNT_ACCESS_KEY,
    APPDYNAMICS_AGENT_APPLICATION_NAME,
    APPDYNAMICS_AGENT_TIER_NAME,
    APPDYNAMICS_AGENT_NODE_NAME,

    // keyvault
    CARVANA_APP_KEYVAULT_URL,
    CARVANA_APP_AZURE_CLIENT_ID,
    CARVANA_APP_AZURE_CLIENT_SECRET,

    // cosmos
    CARVANA_APP_COSMOSDB_RO_SECRET_NAME,
    CARVANA_APP_COSMOSDB_RO_SECRET_VERSION,
    CARVANA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT,
    CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
    CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE
} = environmentVariables;

const isUat = NODE_ENV === 'uat';
const isTest = NODE_ENV === "test";
const isDev = NODE_ENV === "development";
const isProduction = NODE_ENV === 'production';

export const envVariables = {
    isDev,
    isUat,
    isTest,
    isProduction,

    // auth
    authAudiance: AUTH_AUD,
    authIssuer: AUTH_ISS,
    authScope: AUTH_SCOPE,
    authServerUrl: AUTH_SERVER_URL,

    // splunk
    splunkURL: SPLUNK_URL,
    splunkToken: SPLUNK_TOKEN,
    splunkIndex: SPLUNK_INDEX,
    splunkLogLevel: SPLUNK_LOG_LEVEL,

    environment: NODE_ENV,
    PORT: PORT || 4000,

    // appdynamics
    appDynamicsHost: APPDYNAMICS_CONTROLLER_HOST_NAME,
    appDynamicsPort: APPDYNAMICS_CONTROLLER_PORT,
    appDynamicsSSL: APPDYNAMICS_CONTROLLER_SSL_ENABLED,
    appDynamicsAccount: APPDYNAMICS_AGENT_ACCOUNT_NAME,
    appDynamicsKey: APPDYNAMICS_AGENT_ACCOUNT_ACCESS_KEY,
    appDynamicsApp: APPDYNAMICS_AGENT_APPLICATION_NAME,
    appDynamicsTier: APPDYNAMICS_AGENT_TIER_NAME,
    appDynamicsNode: APPDYNAMICS_AGENT_NODE_NAME,

    encryptedSample: ENCRYPTED_SAMPLE,

    // keyvault
    CARVANA_APP_KEYVAULT_URL,
    CARVANA_APP_AZURE_CLIENT_ID,
    CARVANA_APP_AZURE_CLIENT_SECRET,

    // cosmos
    CARVANA_APP_COSMOSDB_RO_SECRET_NAME,
    CARVANA_APP_COSMOSDB_RO_SECRET_VERSION,
    CARVANA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT,
    CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
    CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE
}

