import {CosmosClient} from '@azure/cosmos';
import {VehicleMarketSQL} from './config/VehicleMarketSQL';
import {CarvanaKeyVault} from './config/CarvanaKeyVault';
import dotenv from 'dotenv';
import request from 'request';
import path from 'path';
import XLSX from 'xlsx';

request.defaults({ encoding: null });

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



// Retrive all documents
const selectAll = async _ =>  {
  try {
    var spec = {
        query: `
          Select * from c
            where (NOT is_defined(c.trim_id) and NOT is_defined(c.trim))
            AND (
              (
                c.make = 'Chevrolet'
                AND (
                  (
                    c.year = 2017
                    AND
                    CONTAINS(c.model, 'Bolt EV')
                  )
                  OR
                  (
                    c.year >= 2012
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Camaro')
                  )
                  OR
                  (
                    c.year = 2015
                    AND
                    CONTAINS(c.model, 'Corvette')
                  )
                  OR
                  (
                    c.year >= 2013
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Cruze')
                  )
                  OR
                  (
                    c.year >= 2012
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Equinox')
                  )
                  OR
                  (
                    c.year >= 2014
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Impala')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Malibu')
                  )
                  OR
                  (
                    c.year >= 2016
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Silverado')
                  )
                  OR
                  (
                    c.year >= 2017
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Sonic')
                  )
                  OR
                  (
                    c.year >= 2017
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Spark')
                  )
                  OR
                  (
                    c.year = 2018
                    AND
                    CONTAINS(c.model, 'Suburban')
                  )
                  OR
                  (
                    c.year >= 2016
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Tahoe')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Traverse')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Trax')
                  )
                  OR
                  (
                    c.year >= 2013
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Volt')
                  )
                )
              )
              OR
              (
                c.make = 'Ford'
                AND
                (
                  (
                    c.year >= 2015
                    AND
                    c.year <=2016
                    AND
                    CONTAINS(c.model, 'C-MAX')
                  )
                  OR
                  (
                    c.year = 2018
                    AND
                    CONTAINS(c.model, 'EcoSport')
                  )
                  OR
                  (
                    c.year >= 2013
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Edge')
                  )
                  OR
                  (
                    c.year >= 2013
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Escape')
                  )
                  OR
                  (
                    c.year >= 2017
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Expedition')
                  )
                  OR
                  (
                    c.year >= 2013
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Explorer')
                  )
                  OR
                  (
                    c.year = 2016
                    AND
                    CONTAINS(c.model, 'F150 Super Cab')
                  )
                  OR
                  (
                    c.year >= 2016
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Fiesta')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Flex')
                  )
                  OR
                  (
                    c.year >= 2012
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Focus')
                  )
                  OR
                  (
                    c.year >= 2013
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Fusion')
                  )
                  OR
                  (
                    c.year >= 2012
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Mustang')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <=2018
                    AND
                    CONTAINS(c.model, 'Taurus')
                  )
                )
              )
              OR
              (
                c.make = 'INFINITI'
                AND
                (
                  (
                    c.year = 2017
                    AND
                    CONTAINS(c.model, 'QX50')
                  )
                  OR
                  (
                    c.year = 2018
                    AND
                    CONTAINS(c.model, 'Q50')
                  )
                  OR
                  (
                    c.year = 2018
                    AND
                    CONTAINS(c.model, 'QX60')
                  )
                )
              )
              OR
              (
                c.make = 'Nissan'
                AND
                (
                  (
                    c.year >= 2014
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Altima')
                  )
                  OR
                  (
                    c.year >= 2017
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Armada')
                  )
                  OR
                  (
                    c.year = 2017
                    AND
                    CONTAINS(c.model, 'JUKE')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'LEAF')
                  )
                  OR
                  (
                    c.year >= 2016
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Maxima')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Murano')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Pathfinder')
                  )
                  OR
                  (
                    c.year = 2017
                    AND
                    CONTAINS(c.model, 'Quest')
                  )
                  OR
                  (
                    c.year >= 2013
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Rogue')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Sentra')
                  )
                  OR
                  (
                    c.year >= 2015
                    AND
                    c.year <= 2018
                    AND
                    CONTAINS(c.model, 'Versa')
                  )
                )
              )
            )`,
        parameters: []
    };

    const {resources} = await cdbContainer.items.query(spec).fetchAll();
    return resources;
  } catch (err) {
    console.log(err);
  }
};

const exportValueAddOptionsToExcel = async () => {
    
  const vehiclesToUpdate = await selectAll();
  // console.log(vehiclesToUpdate);

  const partitionKey = {
      kind: "Hash",
      paths: [process.env.CVNA_APP_COSMOSDB_PARTITION_KEY_ALGO_CONTENT]
  }

  const exportLoop = async _ => {
    try {
      const workbookFileName = `ValueAddOptions-${new Date().getTime()}.xlsx`;         
      let workbook = XLSX.utils.book_new();
      let allModelsOptions = [];
      const optionsWorksheetHeaders = [];
      const worksheetName  = `Value-Add Options`;
      let worksheetData = [];

      for(let i = 0; i < vehiclesToUpdate.length; i += 1) {
        const { year, make_id, make, model_id, model, valueAddOptions} = vehiclesToUpdate[i];
        if((valueAddOptions && valueAddOptions.length) && (valueAddOptions.length >= 3)) {
          
          const allValueAddOptions = valueAddOptions.map(option => {
            return {
              year,
              make,
              make_id,
              model,
              model_id,
              option_name: option.option_name,
              option_description: ' ',
              option_id: option.id,
              rarity: option.rarity,
              reference_count: option.reference_count,
            }
          })

          const cleansedValueAddOptions = allValueAddOptions.filter(option => (
            option.option_name !== 'Destination Charge'
            && option.option_name !== 'Destination Change'
            && option.option_name !== 'Destination/Handling'))
          const optionHeaderKeys = Object.keys(cleansedValueAddOptions[0]);
          if (optionsWorksheetHeaders.length === 0) optionsWorksheetHeaders.push(...optionHeaderKeys);
          
          worksheetData.push(...cleansedValueAddOptions);
        }
      }
      const worksheet = XLSX.utils.json_to_sheet(worksheetData, {header:optionsWorksheetHeaders});
      
      XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
      
      XLSX.writeFile(workbook, workbookFileName);
    } catch (err) {
      console.log(err);
    }
  }

  await exportLoop();
}


const begin = async _ => {
    try {
        await sql.init();
        await sql.pool();
        await getCosmosClient().catch(e => console.log(e));
        console.time('Excel Export');
        await exportValueAddOptionsToExcel().catch(e => console.log(e));
        console.timeEnd('Excel Export');
        console.log('Finished with Excel export');
        process.exit(0);
    } catch (err) {
        console.log(err);
    }
}

begin();




