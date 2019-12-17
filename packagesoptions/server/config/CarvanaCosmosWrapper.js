// 'AccountEndpoint=https://someurl.thatoneplace.com:943/;AccountKey=stuffgoesherelfkjsdlkfjslkdjflskdjf==;'

import {CosmosClient} from '@azure/cosmos';
import bluebird from 'bluebird';

const parseCosmosConnectionString = CONNECTION_STRING => {
    const parsedConnectionString = CONNECTION_STRING.split(/=;/);
    const filteredConnectionString = parsedConnectionString.filter(val => (val!==';' || val !== '='));
    return filteredConnectionString;
}

export class CarvanaCosmosWrapper {
    constructor(connection) {
        this.init = this.init.bind(this);
        this.query = this.query.bind(this);
        this._connection = connection;
        this._cosmosClient = null;
    }

    async init() {
        if(this._cosmosClient === null){
          try{
            const {
              CARVANA_APP_COSMOSDB_SECRET_NAME,
              CARVANA_APP_COSMOSDB_SECRET_VERSION,
              CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
              CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE,
              getSecret
            } = this._connection;
            console.log('retrieving credentials from keyvault');
            const CARVANA_APP_COSMOSDB_SECRET = await getSecret({secretName:CARVANA_APP_COSMOSDB_SECRET_NAME, secretVersion:CARVANA_APP_COSMOSDB_SECRET_VERSION});
            console.log('received keyvault creds');
            // const connectionStringProperties = parseCosmosConnectionString(CARVANA_APP_COSMOSDB_SECRET);

            console.log('cosmos is starting up');
            this._cosmosClient = new CosmosClient({
                endpoint: 'https://carvana-algocontent-dev.documents.azure.com:443',
                key: 's1Rq5tBtNx9cBSHHrVJAXORzIpxt4OdRo45NQjlTNXNnXQI71z208tiem3LPaWjQNjQfwXzaxfGkmOGEzDLL9A=='
            })
            console.log('cosmos is ready');
            this._database = await this._cosmosClient.database(CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT);
            this._container = await this._database.container(CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE);
            
            return this;
          } catch(err) {
            console.error(err);
          }
        }
        
        return this._cosmosClient;
    }

    async query(querySpec) {
        try {
            const {resources} = await this._container.items.query(querySpec).fetchAll();
            return resources;
        } catch (err) {
            console.log(err);
            return err;
        }
    }

}

