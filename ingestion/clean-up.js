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

const cleanUpUconnect = async () => {
    try {
        const querySpecPackages = {
            query: `
                SELECT c from c join p IN c.packages where
                    c.make != 'Chrysler' and
                    c.make != 'Jeep' and
                    c.make != 'Ram' and
                    c.make != 'FIAT' and
                    c.make != 'Dodge' and CONTAINS(p.package_name, 'Uconnect')
            `
        };

        const querySpecOptions = {
            query: `
                SELECT c from c join o IN c.valueAddOptions where
                    c.make != 'Chrysler' and
                    c.make != 'Jeep' and
                    c.make != 'Ram' and
                    c.make != 'FIAT' and
                    c.make != 'Dodge' and CONTAINS(o.option_name, 'Uconnect')
            `
        };

        let resources = []
        const pkgResources = await cdbContainer.items.query(querySpecPackages).fetchAll();
        const optResources = await cdbContainer.items.query(querySpecOptions).fetchAll();

        resources = pkgResources['resources'].concat(optResources['resources']);
        console.log(resources);
        if(resources) {
            const vehicleDocs = resources.map(doc => (doc.c))
            
            const cleanUpLoop = async results => {
                for(let i = 0; i < vehicleDocs.length; i +=1) {
                    
                    const vehicleDoc = vehicleDocs[i];

                    const {packages, valueAddOptions} = vehicleDoc;

                    const cleanedUconnectPackages = (packages && packages.length)
                        ? packages.filter(pkg=> {
                            if(pkg.package_name.indexOf('Uconnect') < 0) return pkg;
                        })
                        : [];

                    const cleanedUconnectOptions = (valueAddOptions && valueAddOptions.length)
                        ? valueAddOptions.filter(opt => {
                            if(opt.option_name.indexOf('Uconnect') < 0) return opt;
                        })
                        : [];

                    const vehicleDocWithUconnectCleanedPackagesOptions = Object.assign({}, vehicleDoc, {packages: cleanedUconnectPackages, valueAddOptions: cleanedUconnectOptions});

                    console.log(`updating uconnect on ${i} of ${vehicleDocs.length}`)
                    const { resource: updatedVehicle } = await cdbContainer.items.upsert(vehicleDocWithUconnectCleanedPackagesOptions);
                }
            }

            await cleanUpLoop();
            console.log('done with uconnect')
        }
                

    } catch (err) {
        console.log(err);
    }
}

const cleanUpPrice = async () => {
    try {
        const querySpecPkg = {
            query: `
                SELECT c from c join p IN c.packages where 
                    (p.price < 50 OR p.price > 12000 OR p.price = null)
            `
        };
        const querySpecOpt = {
            query: `
                SELECT c from c join o in c.valueAddOptions where 
                    (o.price < 50 OR o.price > 12000 OR o.price = null)
            `
        };

        let resources = []
        const pkgResources = await cdbContainer.items.query(querySpecPkg).fetchAll();
        const optResources = await cdbContainer.items.query(querySpecOpt).fetchAll();

        resources = pkgResources['resources'].concat(optResources['resources']);
        
        if(resources) {
            const vehicleDocs = resources.map(doc => (doc.c))
            
            const cleanUpLoop = async results => {
                for(let i = 0; i < vehicleDocs.length; i +=1) {
                    
                    const vehicleDoc = vehicleDocs[i];
                    
                    const {packages, valueAddOptions} = vehicleDoc;

                    const cleanedPricePackages = (packages && packages.length)
                        ? packages.filter(pkg=> {
                            if(pkg.price >= 50 && pkg.price <= 12000) return pkg;
                        })
                        : [];

                    const cleanedPriceOptions = (valueAddOptions && valueAddOptions.length)
                        ? valueAddOptions.filter(opt => {
                            if(opt.price >= 50 && opt.price <= 12000) return opt;
                        })
                        : [];

                    const vehicleDocWithPriceCleanedPackagesOptions = Object.assign({}, vehicleDoc, {packages: cleanedPricePackages, valueAddOptions: cleanedPriceOptions});

                    console.log(`updating pricing on ${i} of ${vehicleDocs.length}`)
                    const { resource: updatedVehicle } = await cdbContainer.items.upsert(vehicleDocWithPriceCleanedPackagesOptions);
                }
            }

            await cleanUpLoop();
            console.log('done with pricing clean-up');
        }
                

    } catch (err) {
        console.log(err);
    }
}


const cleanUpAudiContaminants = async () => {
    try {
        const querySpecPackages = {
            query: `
                SELECT c from c join p IN c.packages where
                    c.make != 'Audi' and CONTAINS(p.package_name, 'Audi')
            `
        };

        const querySpecOptions = {
            query: `
                SELECT c from c join o IN c.valueAddOptions where
                    c.make != 'Audi' and CONTAINS(o.option_name, 'Audi')
            `
        };

        let resources = []
        const pkgResources = await cdbContainer.items.query(querySpecPackages).fetchAll();
        const optResources = await cdbContainer.items.query(querySpecOptions).fetchAll();

        resources = pkgResources['resources'].concat(optResources['resources']);
        
        if(resources) {
            const vehicleDocs = resources.map(doc => (doc.c))
            
            const cleanUpLoop = async results => {
                for(let i = 0; i < vehicleDocs.length; i +=1) {
                    
                    const vehicleDoc = vehicleDocs[i];

                    const {packages, valueAddOptions} = vehicleDoc;

                    const cleanedUconnectPackages = (packages && packages.length)
                        ? packages.filter(pkg=> {
                            if(pkg.package_name.indexOf('Audi') < 0) return pkg;
                        })
                        : [];

                    const cleanedUconnectOptions = (valueAddOptions && valueAddOptions.length)
                        ? valueAddOptions.filter(opt => {
                            if(opt.option_name.indexOf('Audi') < 0) return opt;
                        })
                        : [];

                    const vehicleDocWithUconnectCleanedPackagesOptions = Object.assign({}, vehicleDoc, {packages: cleanedUconnectPackages, valueAddOptions: cleanedUconnectOptions});

                    console.log(`updating Audi packages/options on ${i} of ${vehicleDocs.length}`)
                    const { resource: updatedVehicle } = await cdbContainer.items.upsert(vehicleDocWithUconnectCleanedPackagesOptions);
                }
            }

            await cleanUpLoop();
            console.log('done with Audi')
        }
                

    } catch (err) {
        console.log(err);
    }
}


const cleanUpNissanContaminants = async () => {
    try {
        const querySpecPackages = {
            query: `
                SELECT c from c join p IN c.packages where
                    c.make != 'Nissan' and CONTAINS(p.package_name, 'Nissan')
            `
        };

        const querySpecOptions = {
            query: `
                SELECT c from c join o IN c.valueAddOptions where
                    c.make != 'Nissan' and CONTAINS(o.option_name, 'Nissan')
            `
        };

        let resources = []
        const pkgResources = await cdbContainer.items.query(querySpecPackages).fetchAll();
        const optResources = await cdbContainer.items.query(querySpecOptions).fetchAll();

        resources = pkgResources['resources'].concat(optResources['resources']);
        
        if(resources) {
            const vehicleDocs = resources.map(doc => (doc.c))
            
            const cleanUpLoop = async results => {
                for(let i = 0; i < vehicleDocs.length; i +=1) {
                    
                    const vehicleDoc = vehicleDocs[i];

                    const {packages, valueAddOptions} = vehicleDoc;

                    const cleanedUconnectPackages = (packages && packages.length)
                        ? packages.filter(pkg=> {
                            if(pkg.package_name.indexOf('Nissan') < 0) return pkg;
                        })
                        : [];

                    const cleanedUconnectOptions = (valueAddOptions && valueAddOptions.length)
                        ? valueAddOptions.filter(opt => {
                            if(opt.option_name.indexOf('Nissan') < 0) return opt;
                        })
                        : [];

                    const vehicleDocWithUconnectCleanedPackagesOptions = Object.assign({}, vehicleDoc, {packages: cleanedUconnectPackages, valueAddOptions: cleanedUconnectOptions});

                    console.log(`updating Nissan packages/options on ${i} of ${vehicleDocs.length}`)
                    const { resource } = await cdbContainer.items.upsert(vehicleDocWithUconnectCleanedPackagesOptions);
                }
            }

            await cleanUpLoop();
            console.log('done with Nissan')
        }
                

    } catch (err) {
        console.log(err);
    }
}

const cleanUpMoparContaminants = async () => {
    try {
        const querySpecPackages = {
            query: `
                SELECT c from c join p IN c.packages where
                c.make != 'Chrysler' and
                c.make != 'Jeep' and
                c.make != 'Ram' and
                c.make != 'Dodge' and CONTAINS(p.package_name, 'Mopar')
            `
        };

        const querySpecOptions = {
            query: `
                SELECT c from c join o IN c.valueAddOptions where
                c.make != 'Chrysler' and
                c.make != 'Jeep' and
                c.make != 'Ram' and
                c.make != 'Dodge' and CONTAINS(o.option_name, 'Mopar')
            `
        };

        let resources = []
        const pkgResources = await cdbContainer.items.query(querySpecPackages).fetchAll();
        const optResources = await cdbContainer.items.query(querySpecOptions).fetchAll();

        resources = pkgResources['resources'].concat(optResources['resources']);
        
        if(resources) {
            const vehicleDocs = resources.map(doc => (doc.c))
            
            const cleanUpLoop = async results => {
                for(let i = 0; i < vehicleDocs.length; i +=1) {
                    
                    const vehicleDoc = vehicleDocs[i];

                    const {packages, valueAddOptions} = vehicleDoc;

                    const cleanedUconnectPackages = (packages && packages.length)
                        ? packages.filter(pkg=> {
                            if(pkg.package_name.indexOf('Mopar') < 0) return pkg;
                        })
                        : [];

                    const cleanedUconnectOptions = (valueAddOptions && valueAddOptions.length)
                        ? valueAddOptions.filter(opt => {
                            if(opt.option_name.indexOf('Mopar') < 0) return opt;
                        })
                        : [];

                    const vehicleDocWithUconnectCleanedPackagesOptions = Object.assign({}, vehicleDoc, {packages: cleanedUconnectPackages, valueAddOptions: cleanedUconnectOptions});

                    console.log(`updating Mopar packages/options on ${i} of ${vehicleDocs.length}`)
                    const { resource: updatedVehicle } = await cdbContainer.items.upsert(vehicleDocWithUconnectCleanedPackagesOptions);
                }
            }

            await cleanUpLoop();
            console.log('done with Mopar')
        }
                

    } catch (err) {
        console.log(err);
    }
}

const cleanUpHemiContaminants = async () => {
    try {
        const querySpecPackages = {
            query: `
                SELECT c from c join p IN c.packages where
                c.make != 'Chrysler' and
                c.make != 'Jeep' and
                c.make != 'Ram' and
                c.make != 'Dodge' and CONTAINS(p.package_name, 'HEMI')
            `
        };

        const querySpecOptions = {
            query: `
                SELECT c from c join o IN c.valueAddOptions where
                c.make != 'Chrysler' and
                c.make != 'Jeep' and
                c.make != 'Ram' and
                c.make != 'Dodge' and CONTAINS(o.option_name, 'HEMI')
            `
        };

        let resources = []
        const pkgResources = await cdbContainer.items.query(querySpecPackages).fetchAll();
        const optResources = await cdbContainer.items.query(querySpecOptions).fetchAll();

        resources = pkgResources['resources'].concat(optResources['resources']);
        
        if(resources) {
            const vehicleDocs = resources.map(doc => (doc.c))
            
            const cleanUpLoop = async results => {
                for(let i = 0; i < vehicleDocs.length; i +=1) {
                    
                    const vehicleDoc = vehicleDocs[i];

                    const {packages, valueAddOptions} = vehicleDoc;

                    const cleanedUconnectPackages = (packages && packages.length)
                        ? packages.filter(pkg=> {
                            if(pkg.package_name.indexOf('HEMI') < 0) return pkg;
                        })
                        : [];

                    const cleanedUconnectOptions = (valueAddOptions && valueAddOptions.lenght)
                        ? valueAddOptions.filter(opt => {
                            if(opt.option_name.indexOf('HEMI') < 0) return opt;
                        })
                        : [];

                    const vehicleDocWithUconnectCleanedPackagesOptions = Object.assign({}, vehicleDoc, {packages: cleanedUconnectPackages, valueAddOptions: cleanedUconnectOptions});

                    console.log(`updating HEMI packages/options on ${i} of ${vehicleDocs.length}`)
                    const { resource: updatedVehicle } = await cdbContainer.items.upsert(vehicleDocWithUconnectCleanedPackagesOptions);
                }
            }

            await cleanUpLoop();
            console.log('done with HEMI')
        }
                

    } catch (err) {
        console.log(err);
    }
}

const begin = async _ => {
    await getCosmosClient().catch(e => console.log(e));
    console.time('clean-up');
    await cleanUpUconnect();
    await cleanUpPrice();
    await cleanUpAudiContaminants();
    await cleanUpMoparContaminants();
    await cleanUpHemiContaminants();
    await cleanUpNissanContaminants();
    console.timeEnd('clean-up');

    console.log('finished with clean-up');
    process.exit(0);
}

begin();

