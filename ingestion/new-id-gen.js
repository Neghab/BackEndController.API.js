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
import {
    add,
    applySpec,
    curry,
    evolve,
    head,
    groupBy,
    lift,
    map, 
    path,
    pick,
    pipe,
    prop,
    reduce,
    sumBy,
    tail,
    uniqBy,
    values,
    isNil
} from 'ramda';
import fs from 'fs';
import request from 'request';
import pathUtil from 'path';
import util from 'util';
import FuzzySet from "fuzzyset.js"

import { Poppler } from 'node-poppler';


import Typo from 'typo-js';

import XLSX from 'xlsx';

import {optionMock} from './mocks';
import { promises } from 'dns';
import { exec } from 'child_process';


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
        
        cosmosClient = new CosmosClient({ endpoint:cosmosUrl, key:cosmosKey });
        
        const {database} = await cosmosClient.databases.createIfNotExists(
            {id: process.env.CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT},
            {offerThroughput: 400}
        );
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

const updateIds = async _ => {
    try {

        const querySpec = {
            query: "SELECT c.id, c.ymmtId FROM c"
        };

        const { resources: results } = await cdbContainer.items.query(querySpec).fetchAll();
        if(results.length) {
            const vehicleUpdateLoop = async _ => {
                try {
                    for(let i = 0; i < results.length; i += 1) {
                        console.log(`attempting to fetch item ${results[i].id}`)
                        const oldVehicleItem = await cdbContainer.item(results[i].id, results[i].ymmtId);
                        console.log(`attempting to read item ${results[i].id}`)
                        const {resource: oldVehicleDoc} = await oldVehicleItem.read(results[i].ymmtId);
                        
                        const {year, make_url_segment, model_url_segment, trim_url_segment, ymmtId} = oldVehicleDoc;
                        const trimPath = !isNil(trim_url_segment) ? `-${trim_url_segment}` : '';

                        const ymmtTextAsId = `${year}-${make_url_segment}-${model_url_segment}${trimPath}`

                        const newVehicleItem = Object.assign({}, oldVehicleDoc, {id: ymmtTextAsId})

                        const {resource: newDoc} = await cdbContainer.items.create(newVehicleItem);
                        
                        if(newDoc) {
                            console.log(`item with new ID created ${newDoc.id}, attempting to remove by old ID: ${results[i].id}`);
                            try {
                                const deleted = await oldVehicleItem.delete();

                                if(deleted) {
                                    console.log(`item with olde ID deleted: ${results[i].id}`);
                                }
                            } catch(e) {
                                console.log(e);
                            }
                        }

                        console.log(`Processing ${i+1} of ${results.length}...`);
                    }
                } catch (err) {
                    console.log(err);
                }
            }

            await vehicleUpdateLoop();
        }

    }catch (err) {
        console.log(err);
    }
}

const main = async _ => {
    try {

        await getCosmosClient().catch(e => console.log(e));
        
        await updateIds();

        console.log('finished with with ID update');
        process.exit(0);
    } catch (e) {
        console.log(e);
    }
}

main();

