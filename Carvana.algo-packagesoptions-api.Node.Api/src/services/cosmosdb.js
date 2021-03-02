import { CarvanaCosmosWrapper } from '../config/CarvanaCosmosWrapper';

export const savedValues = {};

export class CosmosDBService {
    constructor(config) {
        const { decryptedCosmosDBConnectionString } = config;

        savedValues.decryptedCosmosDBConnectionString = decryptedCosmosDBConnectionString;

        // this.logger = applicationLogger;
        this.init = this.init.bind(this);
        this.config = decryptedCosmosDBConnectionString;
    }

    async init() {
        const sql = new CarvanaCosmosWrapper({getSecret: ''});
        await sql.init();


        return this;
    }
}

