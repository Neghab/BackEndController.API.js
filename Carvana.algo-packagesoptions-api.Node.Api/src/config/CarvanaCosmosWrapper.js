// 'AccountEndpoint=https://carvana-algocontent-pkgopt-dev.documents.azure.com:443/;AccountKey=l2K22p9hQ2vPKu23RDw9gjWp4tvGZ4df7J8KXhoqC8XsyZQkqdOiS1DEZtlzAoMGnEhpEZDlCROvmvcsOkL9Ig==;'

import {CosmosClient} from '@azure/cosmos';

import {splunkLogger} from './logger';
import {envVariables as environmentVariables} from './env.variables';
import { savedValues } from '../services/cosmosdb';

export const DBInstance = { instance: undefined };

const {
    CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT,
    CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE
} = environmentVariables;

// const parseCosmosConnectionString = CONNECTION_STRING => {
//     const parsedConnectionString = CONNECTION_STRING.split(/=;/);
//     const filteredConnectionString = parsedConnectionString.filter(val => (val!==';' || val !== '='));
//     return filteredConnectionString;
// }

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
            this._cosmosClient = new CosmosClient(savedValues.decryptedCosmosDBConnectionString)

            this._database = await this._cosmosClient.database(CARVANA_APP_COSMOSDB_DATABASE_ALGO_CONTENT);
            this._container = await this._database.container(CARVANA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE);

            DBInstance.instance = this;

            return this;
          } catch(error) {
            console.log(error)

            splunkLogger.send({
                message:{
                    event: "Initialize connection to CosmosDB",
                    error
                }
            });
          }
        }

        return this._cosmosClient;
    }

    async query(query) {
        try {
            const cosmosResponse = await this._container.items.query(query).fetchAll();

            splunkLogger.send({
                message:{
                    query,
                    cosmosResponse
                }
            });

            return cosmosResponse;
        } catch (error) {
            console.log(error)

            splunkLogger.send({
                message:{
                    query,
                    error
                }
            });
            return error;
        }
    }

}

