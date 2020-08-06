import {CosmosClient, ConflictResolutionMode} from '@azure/cosmos';
import {CarvanaKeyVault} from './config/CarvanaKeyVault';
import dotenv from 'dotenv';
import fs from 'fs';
import request from 'request';
import pathUtil from 'path';
import { VehicleMarketSQL } from './config/VehicleMarketSQL';
import XLSX from 'xlsx';
import { rows } from 'mssql';


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
    password: 'mq15O*P5s)$q76',
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


const runOptionsScrapeFromXlsx = async () => {
    try {

        const table = XLSX.readFile("./1243.xlsx");
        const sheet = table.Sheets[table.SheetNames[0]];

        const range = XLSX.utils.decode_range(sheet['!ref']);

        const outWb = XLSX.utils.book_new();

        let worksheetData = []; 


        for (let rowNum = range.s.r+1; rowNum < range.e.r; rowNum++) {
            const ymmt_year = sheet[XLSX.utils.encode_cell({r: rowNum, c: 0})];
            const ymmt_make = sheet[XLSX.utils.encode_cell({r: rowNum, c: 1})];
            const ymmt_model = sheet[XLSX.utils.encode_cell({r: rowNum, c: 2})];
            const ymmt_trim = sheet[XLSX.utils.encode_cell({r: rowNum, c: 3})];

            // console.log(ymmt_year.v.toString(), ymmt_make.v.toString(), ymmt_model.v.toString(), ymmt_trim.v.toString());
    
            const querySpec = {
                query: `SELECT * from c where c.year = ${ymmt_year.v} AND c.make = '${ymmt_make.v.toString()}' AND c.model = '${ymmt_model.v.toString()}' AND c.trim = '${ymmt_trim.v.toString()}'`
            };
            
            console.log(querySpec.query);

            const { resources: vehicleDocs } = await cdbContainer.items.query(querySpec).fetchAll();

            console.log(vehicleDocs)

            for (let i = 0; i < vehicleDocs.length; i += 1) {
                const {year, make, model, trim, make_id, model_id, trim_id, valueAddOptions} = vehicleDocs[i];
                const baseVehicle = {
                    year,
                    make,
                    model,
                    trim,
                    make_id,
                    model_id,
                    trim_id
                }

                for (let e = 0; e < valueAddOptions.length; e += 1) {
                    const {option_name, id} = valueAddOptions[e];
                    // console.log(option_name);
                    const trimOption = Object.assign({}, baseVehicle, {option_name, option_id: id, option_description: ''});
                    worksheetData.push(trimOption);
                }
            }
        }
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(outWb, worksheet, 'Trim Options');

        XLSX.writeFile(outWb, 'trim_options.xlsx');
        
        // console.log(vehicleDocs);
        
        // for (let i = 0; i < vehicleDocs.length; i +=1) {
        //     const vehicleDoc = vehicleDocs[i];
        //     const {year, make, model} = vehicleDoc;
        //     console.log(`${year} ${make} ${model}`);
            
        //     const brochure_path = await brochurePathQuery({year, make, model});
            
        //     const updatedVehicleDocWithBrochurePath = Object.assign({}, vehicleDoc, { brochure_path });
        //     console.log('UPDATED DOC:', updatedVehicleDocWithBrochurePath);
            
        //     // KJ: Just waiting your approval before I uncomment this line
        //     // await cdbContainer.items.upsert(updatedVehicleDocWithBrochurePath);
        // }
        
    } catch (err) {
        console.log(err);
    }
}

const begin = async _ => {
    await getCosmosClient().catch(e => console.log(e));
    await runOptionsScrapeFromXlsx();

    // console.log('finished updating brochure links');
    process.exit(0);
}

begin();
