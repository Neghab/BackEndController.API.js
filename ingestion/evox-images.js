import {CosmosClient} from '@azure/cosmos';
import {VehicleMarketSQL} from './config/VehicleMarketSQL';
import {CarvanaKeyVault} from './config/CarvanaKeyVault';
import {padId} from './utils';
import https from 'https';
import {
    applySpec,
    groupBy,
    map, 
    path,
    pick,
    pipe,
    uniqBy,
    values,
    isNil
} from 'ramda';
import fs from 'fs';
import pathUtil from 'path';


const config = dotenv.config({path:pathUtil.resolve(process.cwd(),`.env.${process.env.RUNTIME_ENV}`)}).parsed;

let CDBClient, CDBContainer, CDBDatabase;

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
        const cosmosClient = new CosmosClient({ endpoint:cosmosUrl, key:cosmosKey });
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
        console.log('Connected to database and container');
        return Promise.resolve({cosmosClient, database, container});
    } catch (err) {
        return Promise.reject(err);
    }
}

const evoxSql = new VehicleMarketSQL({
    user: 'DTReader',
    password: 'azur3Reader',
    server: 'dja4h2bgpc.database.windows.net',
    database: 'CarvanaProd',
    connectionTimeout: 2400000,
    requestTimeout: 2400000,
    encrypt: true,
    pool: {
        max:100,
        idleTimeoutMillis: 2400000
    }
});




const processImage = async vehicle => {
    try {
        let evoxUrl, evoxImageLocalFileName;
        const {year, make, model, trim} = vehicle;
        if(typeof(trim) !== "undefined") {
            const evoxFileNameParts = String(`${year}-${make}-${model}-${trim}`).toLowerCase().replace(/[\.\s]/g, '-');
            evoxImageLocalFileName = `${evoxFileNameParts}.png`;
            const evoxImageYmmt = await fetchImageByYmmt(vehicle);
            console.log(evoxImageYmmt, evoxImageLocalFileName, {year, make, model, trim});
            if(evoxImageYmmt) {
                evoxUrl = evoxImageYmmt['URLToImage'];
            } else {
                const evoxImageYmm = await fetchImageByYmmt(vehicle);
                console.log(evoxImageYmm, evoxImageLocalFileName, {year, make, model, trim});
                if(evoxImageYmm) {
                    evoxUrl = evoxImageYmm['URLToImage'];
                }
            }
        } else {
            const evoxFileNameParts = String(`${year}-${make}-${model}`).toLowerCase().replace(/[\.\s]/g, '-');
            evoxImageLocalFileName = `${evoxFileNameParts}.png`;
            const evoxImageYmm = await fetchImageByYmmt(vehicle);
            console.log(evoxImageYmm, evoxImageLocalFileName, {year, make, model});
            if(evoxImageYmm) {
                evoxUrl = evoxImageYmm['URLToImage'];
            }
        }
        
        if(evoxUrl) {
            console.log(evoxUrl);
            const folderPath = pathUtil.resolve(`/Carvana.Assets/algocontent/vehicle-evox/`);
            
            const filePath = pathUtil.join(process.cwd(), folderPath, evoxImageLocalFileName);
            
            console.log('this should have an image: ', evoxUrl)
            try {
                await https.get(`https:${evoxUrl}`, function(response) {
                    const success = response.statusCode === 200;
                    if(success) {
                        const file = fs.createWriteStream(filePath);
                        response.pipe(file);
                    }
                }).on('error', err => {
                    console.log(err);
                })
            } catch (err) {
                console.log(err);
            }
            
        }

    } catch (err) {
        console.log("Image processing error: ", err);
    }
}

const fetchImageByYmmt = async vehicle => {
    try {
        await evoxSql.init();

        const cp = await evoxSql.pool();

        const {make, model, trim, year} = vehicle;

        let trimQuery = '';

        if (!isNil(trim)) {
            trimQuery = ` and T.[Trim] like '${String(vehicle.trim).toLowerCase()}'`;
        }

        const {recordset: result} = await cp.request()
            .query(`
                select top 1 * from  
                (
                    SELECT ev.[VIF]
                    ,[Make]
                    ,[Model]
                    ,[Year]
                    ,[Trim]
                    ,[BodyStyle]
                    ,ev.[RowLoadedDateTime]
                    ,ev.[RowUpdatedDateTime]
                    ,evc.BasicColor
                    ,vi.URLToImage
                    ,vi.Angle as image_angle
                    ,vi.Size as image_size
                    FROM [vds].[tblEvoxVehicle] ev
                    join [vds].[tblEvoxVehicleColor] evc on ev.VIF = evc.VIF
                    join [vds].[tblEvoxVehicleImage] vi on vi.VIF = evc.VIF
                )
                as T
                where T.Make like '${String(make).toLowerCase()}%' and T.Model like '${String(model).toLowerCase()}'${trimQuery} and T.Year = ${year} and T.BasicColor like 'white' and T.image_angle = 32 and T.image_size = 1200;
            `)
        const response = result[0] || false;
        return Promise.resolve(response);
    } catch (err) {
        console.log(err);
    }
}

const batchProcessImages = async _ => {
    try {

        const querySpec = {
            query: "SELECT c.year, c.make, c.model, c.trim, c.make_url_segment, c.model_url_segment, c.trim_url_segment FROM c"
        };

        const { resources: results } = await cdbContainer.items.query(querySpec).fetchAll();

        while (result in results) {
            await processImage(result);
        }

    } catch (e) {
        console.log(e);
    }
}

const main = async _ => {
    try {

        const { cosmosClient, database, container } = await getCosmosClient().catch(e => console.log(e));
        CDBClient = cosmosClient;
        CDBDatabase = database;
        CDBContainer = container;

        await batchProcessImages().catch(e => console.log(e));

        console.log('finished with with evox images');
        process.exit(0);
    } catch (e) {
        console.log(e);
    }
}

main();
