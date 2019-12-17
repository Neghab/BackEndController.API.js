import dotenv from 'dotenv';
import path from 'path';

const getConfig = () => {
  if(process.env.IS_LOCAL_DEVELOPMENT === 'true') {
    try{
      const localEnvConfig = dotenv.config({path:path.resolve(process.cwd(),'.env.development')})
      console.log(localEnvConfig.parsed);
      return localEnvConfig.parsed;
    }catch(err){
      throw err;
    }
  }else{
    return {
      CARVANA_APP_APP_INSIGHT_KEY: process.env.CARVANA_APP_APP_INSIGHT_KEY,
      CARVANA_APP_SPLUNK_TOKEN: process.env.CARVANA_APP_SPLUNK_TOKEN,
      CARVANA_APP_SPLUNK_URL: process.env.CARVANA_APP_SPLUNK_URL,
      CARVANA_APP_KEYVAULT_URL: process.env.CARVANA_APP_KEYVAULT_URL,
      CARVANA_APP_AZURE_CLIENT_ID: process.env.CARVANA_APP_AZURE_CLIENT_ID,
      CARVANA_APP_AZURE_CLIENT_SECRET: process.env.CARVANA_APP_AZURE_CLIENT_SECRET,
      CARVANA_APP_COSMOSDB_SECRET_NAME: process.env.CARVANA_APP_COSMOSDB_SECRET_NAME,
      CARVANA_APP_COSMOSDB_SECRET_VERSION: process.env.CARVANA_APP_COSMOSDB_SECRET_VERSION,
      CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT: process.env.CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
      CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE: process.env.CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE
    }
  }
}

export default getConfig();
  