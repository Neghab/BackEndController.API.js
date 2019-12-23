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
    if(process.env.NODE_ENV) {
      const environment = process.env.NODE_ENV;
      console.log(environment);
      return dotenv.config({path:path.resolve(process.cwd(), `.env.${environment}`)}).parsed;
    }
    return {
      CVNA_APP_APP_INSIGHT_KEY: process.env.CVNA_APP_APP_INSIGHT_KEY,
      CVNA_APP_SPLUNK_TOKEN: process.env.CVNA_APP_SPLUNK_TOKEN,
      CVNA_APP_SPLUNK_URL: process.env.CVNA_APP_SPLUNK_URL,
      CVNA_APP_KEYVAULT_URL: process.env.CVNA_APP_KEYVAULT_URL,
      CVNA_APP_AZURE_CLIENT_ID: process.env.CVNA_APP_AZURE_CLIENT_ID,
      CVNA_APP_AZURE_CLIENT_SECRET: process.env.CVNA_APP_AZURE_CLIENT_SECRET,
      CVNA_APP_COSMOSDB_SECRET_NAME: process.env.CVNA_APP_COSMOSDB_SECRET_NAME,
      CVNA_APP_COSMOSDB_SECRET_VERSION: process.env.CVNA_APP_COSMOSDB_SECRET_VERSION,
      CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT: process.env.CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT,
      CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT: process.env.CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
      CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE: process.env.CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE
    }
  }
}

export default getConfig();
  