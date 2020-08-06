import {CosmosClient, ConflictResolutionMode} from '@azure/cosmos';
import {CarvanaKeyVault} from './config/CarvanaKeyVault';
import dotenv from 'dotenv';
import fs from 'fs';
import request from 'request';
import pathUtil from 'path';
import { VehicleMarketSQL } from './config/VehicleMarketSQL';

request.defaults({ encoding: null });

const config = dotenv.config({path:pathUtil.resolve(process.cwd(),`.env.${process.env.RUNTIME_ENV}`)}).parsed;

let cosmosClient, cdbContainer;

const getCosmosClient = async () => {
    try {
        const keyvault = new CarvanaKeyVault(config);
        keyvault.init();
    
        const cosmosUrl = `https://${process.env.CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT}.documents.azure.com:443/`;
        const cosmosKey = await keyvault.getSecret({
            secretName: process.env.CVNA_APP_COSMOSDB_RW_SECRET_NAME,
            secretVersion: process.env.CVNA_APP_COSMOSDB_RW_SECRET_VERSION
        });
        console.log(`AccountEndpoint=${cosmosUrl};AccountKey=${cosmosKey};`);
        cosmosClient = new CosmosClient({ endpoint:cosmosUrl, key:cosmosKey });
        console.log('attempt to get the database');
        const {database} = await cosmosClient.databases.createIfNotExists(
            {id: process.env.CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT},
            {offerThroughput: 400}
        );
        console.log('attempt to get the container');
        const { container } = await database.containers.createIfNotExists(
            {
                id: process.env.CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE,
                partitionKey: {
                    kind: "Hash",
                    paths: [process.env.CVNA_APP_COSMOSDB_PARTITION_KEY_ALGO_CONTENT]
                }
            },
            {
                offerThroughput: 400
            }
        );
        cdbContainer = container;
        console.log('Connected to database and container');
        return Promise.resolve({cosmosClient, database, container});
    } catch (err) {
        return Promise.reject(err);
    }
}

const sql = new VehicleMarketSQL({
    user: 'svc-algorithmic',
    password: 'oGWl5k00=^iYYs*nTr$5B3ax',
    server: 'vehiclemarket-ro.ad.carvana.com',
    database: 'VehicleMarketDM',
    port: 1433,
    connectionTimeout: 2400000,
    requestTimeout: 2400000,
    pool: {
        max:100,
        idleTimeoutMillis: 2400000
    }
});

const brochurePathQuery = async ({year, make, model}) => {
    try {
        await sql.init();
        
        const cp = await sql.pool();
        console.log('Attempting to fetch all makes...');
        try {
            const {recordset: result} = await cp.request()
                .query(`
                SELECT *  
                    FROM [VehicleMarketDM].[dbo].[ymm_brochure]
                    where year = ${year} and make like '${make}' and model like '${model}'
                    order by year asc
                `)
                
                
            if (result.length > 0){
                return Promise.resolve(result[0]['brochure_path']);
            }
            
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
        
    } catch(err) {
        return Promise.reject(err);
    }
}


const runBrochurePaths = async () => {
    try {
        const querySpec = {
            query: "SELECT * from c"
        };
        
        const { resources: vehicleDocs } = await cdbContainer.items.query(querySpec).fetchAll();
        
        for (let i = 0; i < vehicleDocs.length; i +=1) {
            const vehicleDoc = vehicleDocs[i];
            const {year, make, model} = vehicleDoc;
            console.log(`${year} ${make} ${model}`);
            
            const brochure_path = await brochurePathQuery({year, make, model});
            
            const updatedVehicleDocWithBrochurePath = Object.assign({}, vehicleDoc, { brochure_path });
            
            await cdbContainer.items.upsert(updatedVehicleDocWithBrochurePath);
        }
        
    } catch (err) {
        console.log(err);
    }
}

const begin = async _ => {
    await getCosmosClient().catch(e => console.log(e));
    await runBrochurePaths();

    console.log('finished updating brochure links');
    process.exit(0);
}

begin();
