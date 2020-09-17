const { NODE_ENV } = process.env;
const dotenv = require('dotenv').config({ path: `src/.env.${NODE_ENV}` })
const environmentVariables = Object.keys(dotenv.parsed).reduce((env, key) => {
    env[key] = dotenv.parsed[key];
    return env;
}, {})
console.log(environmentVariables);

const {
    SPLUNK_TOKEN,
    SPLUNK_INDEX,
    SPLUNK_LOG_LEVEL,
    SPLUNK_URL,
    REDIS_CONNECTION_STRING,
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

    // splunk
    CARVANA_APP_SPLUNK_URL,
    CARVANA_APP_SPLUNK_TOKEN,

    // elastic
    CARVANA_APP_ELASTIC_USER,
    CARVANA_APP_ELASTIC_URI,
    CARVANA_APP_ELASTIC_PORT,
    CARVANA_APP_AZURE_VAULT_ELASTIC_SECRET_NAME,
    CARVANA_APP_AZURE_VAULT_ELASTIC_SECRET_VERSION,

    // keyvault
    CARVANA_APP_KEYVAULT_URL,
    CARVANA_APP_AZURE_CLIENT_ID,
    CARVANA_APP_AZURE_CLIENT_SECRET,

    // redis
    CARVANA_APP_REDIS_URI,
    CARVANA_APP_REDIS_PORT,
    CARVANA_APP_AZURE_VAULT_REDIS_SECRET_NAME,
    CARVANA_APP_AZURE_VAULT_REDIS_SECRET_VERSION,

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
    authAudiance: AUTH_AUD,
    authIssuer: AUTH_ISS,
    authScope: AUTH_SCOPE,
    isProduction,
    authServerUrl: AUTH_SERVER_URL,
    splunkURL: SPLUNK_URL,
    environment: NODE_ENV,
    splunkToken: SPLUNK_TOKEN,
    splunkIndex: SPLUNK_INDEX,
    PORT: PORT || 4000,
    splunkLogLevel: SPLUNK_LOG_LEVEL,
    redisEncryptedConnectionString: REDIS_CONNECTION_STRING,

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

    // splunk
    CARVANA_APP_SPLUNK_URL,
    CARVANA_APP_SPLUNK_TOKEN,

    // elastic
    CARVANA_APP_ELASTIC_USER,
    CARVANA_APP_ELASTIC_URI,
    CARVANA_APP_ELASTIC_PORT,
    CARVANA_APP_AZURE_VAULT_ELASTIC_SECRET_NAME,
    CARVANA_APP_AZURE_VAULT_ELASTIC_SECRET_VERSION,

    // keyvault
    CARVANA_APP_KEYVAULT_URL,
    CARVANA_APP_AZURE_CLIENT_ID,
    CARVANA_APP_AZURE_CLIENT_SECRET,

    // redis
    CARVANA_APP_REDIS_URI,
    CARVANA_APP_REDIS_PORT,
    CARVANA_APP_AZURE_VAULT_REDIS_SECRET_NAME,
    CARVANA_APP_AZURE_VAULT_REDIS_SECRET_VERSION,

    // cosmos
    CARVANA_APP_COSMOSDB_RO_SECRET_NAME,
    CARVANA_APP_COSMOSDB_RO_SECRET_VERSION,
    CARVANA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT,
    CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
    CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE
}
