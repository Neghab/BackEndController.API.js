import dotenv from 'dotenv';
import path from 'path';

const getConfig = () => {
  try{
    if(process.env.LOCAL_DEV) {
      return dotenv.config({path:path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`)}).parsed;
    }
    
    const config = {
      CVNA_APP_SPLUNK_URL: process.env.CVNA_APP_SPLUNK_URL,
      CVNA_APP_SPLUNK_TOKEN: process.env.CVNA_APP_SPLUNK_TOKEN,
      CVNA_APP_APP_INSIGHTS_KEY: process.env.CVNA_APP_APP_INSIGHTS_KEY,
      CVNA_APP_KEYVAULT_URL: process.env.CVNA_APP_KEYVAULT_URL,
      CVNA_APP_AZURE_CLIENT_ID: process.env.CVNA_APP_AZURE_CLIENT_ID,
      CVNA_APP_AZURE_CLIENT_SECRET: process.env.CVNA_APP_AZURE_CLIENT_SECRET,
      CVNA_APP_COSMOSDB_RO_SECRET_NAME: process.env.CVNA_APP_COSMOSDB_RO_SECRET_NAME,
      CVNA_APP_COSMOSDB_RO_SECRET_VERSION: process.env.CVNA_APP_COSMOSDB_RO_SECRET_VERSION,
      CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT: process.env.CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT,
      CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT: process.env.CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
      CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE: process.env.CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE
    }
    
    return config;
  }catch(err){
    throw err;
  }
}

export default getConfig();
  