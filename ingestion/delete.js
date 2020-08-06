import {CosmosClient} from '@azure/cosmos';
import {VehicleMarketSQL} from './config/VehicleMarketSQL';
import {CarvanaKeyVault} from './config/CarvanaKeyVault';
import {padId} from './utils';
import { AnonymousCredential, BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import PDF2Pic from 'pdf2pic';
import {PDFImage} from 'pdf-image';
import https from 'https';
import dotenv from 'dotenv';
import streams from 'memory-streams';
import {makesList} from './lookups/makes';
import fs from 'fs';
import request from 'request';
import path from 'path';
import util from 'util';

request.defaults({ encoding: null });

const fileExists = util.promisify(fs.exists);

const renameFile = util.promisify(fs.rename);

const config = dotenv.config({path:path.resolve(process.cwd(),`.env.${process.env.RUNTIME_ENV}`)}).parsed;

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
        console.log(cosmosUrl, cosmosKey);
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
        console.log(err);
    }
}


// Retrive all documents
const selectAll = async _ =>  {
    try {
        var spec = {
            query: "SELECT * FROM c",
            parameters: []
        };

        const {resources} = await cdbContainer.items.query(spec).fetchAll();
        return resources;
    } catch (err) {
        console.log(err);
    }
  };

const deleteAll = async () => {
    
    const itemsToDelete = await selectAll();

    const partitionKey = {
        kind: "Hash",
        paths: [process.env.CVNA_APP_COSMOSDB_PARTITION_KEY_ALGO_CONTENT]
    }

    const deleteLoop = async _ => {
        try {
            for(let i = 0; i < itemsToDelete.length; i += 1) {
                console.log(itemsToDelete[i].id, itemsToDelete[i].ymmtId);
                await cdbContainer.item(itemsToDelete[i].id, itemsToDelete[i].ymmtId).delete()
            }
        } catch (err) {

        }
    }

    await deleteLoop();
}


const begin = async _ => {
    try {
        await getCosmosClient().catch(e => console.log(e));
        await deleteAll().catch(e => console.log(e));
        
        // await parseAllTrimsPackages(2012, 4, 'Audi').catch(e => console.log(e));

        // const ymmt = `2019-00000004-00033614-00354588`;
        // const querySpec = ymmtId => ({
        //     query: "SELECT * FROM c WHERE c.ymmtId = @ymmtId",
        //     parameters: [
        //         {
        //             name: "@ymmtId",
        //             value: ymmtId
        //         }
        //     ]
        // });

        // const query = querySpec(ymmt);

        // const {resources} = await cdbContainer.items.query(query).fetchAll()    

        // const vehicleTrim = resources[0];
        // console.log(vehicleTrim);
        console.log('finished with ingestion');
        process.exit(0);
    } catch (err) {
        console.log(err);
    }
}

begin();




