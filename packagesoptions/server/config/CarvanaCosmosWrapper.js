// 'AccountEndpoint=https://carvana-algocontent-pkgopt-dev.documents.azure.com:443/;AccountKey=l2K22p9hQ2vPKu23RDw9gjWp4tvGZ4df7J8KXhoqC8XsyZQkqdOiS1DEZtlzAoMGnEhpEZDlCROvmvcsOkL9Ig==;'

import {CosmosClient} from '@azure/cosmos';
import bluebird from 'bluebird';

import {splunkLogger} from '../logger';

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
        this._database = {};
        this._container = {};
    }

    async init() {
        if(this._cosmosClient === null){
          try{
            const {
              CVNA_APP_COSMOSDB_SECRET_NAME,
              CVNA_APP_COSMOSDB_SECRET_VERSION,
              CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT,
              CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
              CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE,
              getSecret
            } = this._connection;
            // console.log('retrieving credentials from keyvault');
            const CVNA_APP_COSMOSDB_SECRET = await getSecret({secretName:CVNA_APP_COSMOSDB_SECRET_NAME, secretVersion:CVNA_APP_COSMOSDB_SECRET_VERSION});
            // console.log('received keyvault creds');
            // const connectionStringProperties = parseCosmosConnectionString(CVNA_APP_COSMOSDB_SECRET);

            
            this._cosmosClient = new CosmosClient({
                endpoint: `https://${CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT}.documents.azure.com:443/`,
                key: CVNA_APP_COSMOSDB_SECRET
            })
            
            console.log('cosmos is ready');
            this._database = await this._cosmosClient.database(CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT);
            this._container = await this._database.container(CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE);
            
            console.log('connecting to container');
            // this._container = await this._database.containers.createIfNotExists('packagesoptions-vehicle');
            
            return this;
          } catch(err) {
            console.error(err);
          }
        }
        
        return this._cosmosClient;
    }

    async query(querySpec) {
        try {
            console.log('attempting to query container');
            console.log(this._container)
            const cosmosResponse = await this._container.items.query(querySpec).fetchAll();

            splunkLogger.send({
                message:{
                    cosmosResponse
                }
            });

            return cosmosResponse;
        } catch (err) {
            console.log(err);
            return err;
        }
    }

}

