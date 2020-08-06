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

import {map} from 'ramda';

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


const getInventoryCountByYearMakeModelTrim = async (vehicle) => {
  try {
      await sql.init();

      const cp = await sql.pool();
      const {year, make_id, model_id, trim_id} = vehicle;
      let trimQueryDefault = 'is not null';
      const trimQuery = (typeof(trim_id)!== 'undefined') ? `= '${trim_id}'` : trimQueryDefault
      try {
          const {recordset: result} = await cp.request()
              .query(`
                  select distinct kd.make, kd.model, kd.trim, kd.vehicle_id
                      from VehicleMarketDM.dbo.kbb_description kd
                      join VehicleMarketDM.dbo.vehicle v on v.id = kd.vehicle_id
                      join VehicleMarketDM.dbo.vehicle_merch_package vmp on vmp.vehicle_id = v.id
                      join VehicleMarketDM.dbo.merch_package mp on vmp.merch_package_id = mp.id
                      where v.year = ${year} and kd.make_id = ${make_id} and kd.model_id = ${model_id} and kd.trim_id ${trimQuery}
              `)

          const inventory_count = result && result.length;
          return Promise.resolve(inventory_count);

      } catch (err) {
          return Promise.reject(err);
      }
  } catch (err) {
      return Promise.reject(err);
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


const getPercentageOfCountInInventory = (reference_count, inventory_count) => {
  const rarity_percentage = (100*reference_count) / inventory_count;
  return (rarity_percentage > 100) ? 100 : rarity_percentage;
}


const updateInventoryAndRarity = async () => {
    
    const vehiclesToUpdate = await selectAll();
    // console.log(vehiclesToUpdate);

    const partitionKey = {
        kind: "Hash",
        paths: [process.env.CVNA_APP_COSMOSDB_PARTITION_KEY_ALGO_CONTENT]
    }

    const updateLoop = async _ => {
        try {
            for(let i = 0; i < vehiclesToUpdate.length; i += 1) {
              const { year, make_id, make, model_id, model, trim_id, trim, packages, valueAddOptions} = vehiclesToUpdate[i];
              const inventory_count = await getInventoryCountByYearMakeModelTrim({year, make_id, model_id, trim_id})
              const updatedPackages = packages
                ? map(pkg => {
                  const rarity = getPercentageOfCountInInventory(pkg.reference_count, inventory_count);
                  const updates = {rarity};
                  const newPkg = Object.assign({}, pkg, updates);
                  return newPkg;
                })(packages)
                : [];

              const updatedValueAddOptions = valueAddOptions
                ? map(option => {
                  const rarity = getPercentageOfCountInInventory(option.reference_count, inventory_count);
                  const updates = {rarity};
                  const newOption = Object.assign({}, option, updates);
                  return newOption;
                })(valueAddOptions)
                : [];

              const newVehicleUpdates = {
                packages: updatedPackages,
                valueAddOptions: updatedValueAddOptions,
                inventory_count
              }

              const updatedVehicle = Object.assign({}, vehiclesToUpdate[i], newVehicleUpdates);
              const {resource} = await cdbContainer.items.upsert(updatedVehicle);
              console.log(`Updated inventory + rarity for ${year} ${make} ${model} ${trim && trim}`)
            }
        } catch (err) {
          console.log(err);
        }
    }

    await updateLoop();
}


const begin = async _ => {
    try {
        await sql.init();
        await sql.pool();
        await getCosmosClient().catch(e => console.log(e));
        console.time('Rarity update');
        await updateInventoryAndRarity().catch(e => console.log(e));
        console.timeEnd('Rarity update');
        console.log('finished with inventory / rarity updates');
        process.exit(0);
    } catch (err) {
        console.log(err);
    }
}

begin();




