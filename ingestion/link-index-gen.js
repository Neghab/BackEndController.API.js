import {CosmosClient} from '@azure/cosmos';
import {CarvanaKeyVault} from './config/CarvanaKeyVault';
import dotenv from 'dotenv';
import fs from 'fs';
import request from 'request';
import pathUtil from 'path';

request.defaults({ encoding: null });

const config = dotenv.config({path:pathUtil.resolve(process.cwd(),`.env.${process.env.RUNTIME_ENV}`)}).parsed;

let cosmosClient, cdbContainer;

const getCosmosClient = async () => {
    try {
        const keyvault = new CarvanaKeyVault(config);
        keyvault.init();
    
        const cosmosUrl = `https://${process.env.CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT}.documents.azure.com:443/`;
        const cosmosKey = await keyvault.getSecret({
            secretName: process.env.CVNA_APP_COSMOSDB_RO_SECRET_NAME,
            secretVersion: process.env.CVNA_APP_COSMOSDB_RO_SECRET_VERSION
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
        return Promise.reject(err);
    }
}

const runSiteMapLinkGen = async () => {
    try {
        const querySpec = {
            query: "SELECT c.year, c.make_url_segment, c.model_url_segment, c.trim_url_segment, c.packages, c.valueAddOptions FROM c"
        };

        const { resources: results } = await cdbContainer.items.query(querySpec).fetchAll();

        const writeToFile = async (arr) => {
            return new Promise((resolve, reject) => {
              const file = fs.createWriteStream(pathUtil.join(process.cwd(), 'links.txt'));
              for (const row of arr) {
                const regex = /[,'\+!\(\)\/\\|]/
                const trimSegment = (row.trim_url_segment) ? `${row.trim_url_segment}-` : '';
                if(trimSegment.search(regex) === -1) {
                    if(row.packages || row.valueAddOptions){
                        const totalPackages = parseInt(row.packages?.length);
                        const totalOptions = parseInt(row.valueAddOptions?.length);
                        const totalPackagesOptions = parseInt(totalPackages + totalOptions);
                        if(totalPackagesOptions >= 3) {
                            const link = `https://www.carvana.com/guides/${row.make_url_segment}-${row.model_url_segment}/${trimSegment}${row.year}-packages-options`;
                            file.write(link + "\n");
                        }
                    }
                }
              }
              file.end();
              file.on("finish", () => { resolve(true); });
              file.on("error", reject);
            });
          }
        await writeToFile(results);
        

    } catch (err) {
        console.log(err);
    }
}

const begin = async _ => {
    await getCosmosClient().catch(e => console.log(e));

    await runSiteMapLinkGen();

    console.log('finished with ingestion');
    process.exit(0);
}

begin();

