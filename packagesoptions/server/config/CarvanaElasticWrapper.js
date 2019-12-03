import {Client} from '@elastic/elasticsearch';


export class CarvanaElasticWrapper {
    constructor(connection){
        this.init = this.init.bind(this);
        this._connection = connection;
        this._elasticClient = null;
    }

    async init() {
        if(this._elasticClient === null){
            const {
                CARVANA_APP_ELASTIC_USER,
                CARVANA_APP_ELASTIC_URI,
                CARVANA_APP_ELASTIC_PORT,
                CARVANA_APP_AZURE_VAULT_ELASTIC_SECRET_NAME,
                CARVANA_APP_AZURE_VAULT_ELASTIC_SECRET_VERSION,
                getSecret
              } = this._connection;
            const CARVANA_APP_ELASTIC_SECRET = await getSecret({secretName:CARVANA_APP_AZURE_VAULT_ELASTIC_SECRET_NAME, secretVersion:CARVANA_APP_AZURE_VAULT_ELASTIC_SECRET_VERSION});
            this._elasticClient = await new Client({
                node: `https://${CARVANA_APP_ELASTIC_USER}:${CARVANA_APP_ELASTIC_SECRET}@${CARVANA_APP_ELASTIC_URI}:${CARVANA_APP_ELASTIC_PORT}`,
                ssl: {
                rejectUnauthorized: false
                }
            });
            return this._elasticClient;
        }
        
        return this._elasticClient;
    }

    async search(query) {
        let results = {};
        if(this._elasticClient !== null){
            results = await this._elasticClient.search(query);
            return results;
        }
        return results;
    }
}

