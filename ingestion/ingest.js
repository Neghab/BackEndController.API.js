import {CosmosClient} from '@azure/cosmos';
import {VehicleMarketSQL} from './config/VehicleMarketSQL';
import {CarvanaKeyVault} from './config/CarvanaKeyVault';
import {padId} from './utils';
import dotenv from 'dotenv';
import {
    andThen,
    applySpec,
    assoc,
    filter,
    groupBy,
    map, 
    path,
    pick,
    pipeWith,
    pipe,
    prop,
    sort,
    tap,
    values,
    propEq,
    concat
} from 'ramda';
import request from 'request';
import pathUtil from 'path';
import FuzzySet from "fuzzyset.js"



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

let makeTalley = 0;

const getAllDistinctMakes = async _ => {
    try {

        await sql.init();

        const cp = await sql.pool();
        console.log('Attempting to fetch all makes...');
        try {
            const {recordset: result} = await cp.request()
                .query(`
                select distinct T.make, T.make_id from
                    (
                        select va.id as vehicle_id, va.vin, va.year, kda.make, kda.model, kda.body_style, kda.trim, kda.engine, kda.transmission, kda.ymmtbe_id, make_id, model_id, trim_id
                        from VehicleMarketDM.dbo.kbb_description kda 
                        join VehicleMarketDM.dbo.vehicle va on va.id = kda.vehicle_id
                        where kda.vehicle_id in
                        (
                            select max(v.id)
                            from VehicleMarketDM.dbo.kbb_description kd 
                            join VehicleMarketDM.dbo.vehicle v on v.id = kd.vehicle_id
                            join VehicleMarketDM.dbo.vehicle_merch_package vmp on vmp.vehicle_id = v.id
                            join VehicleMarketDM.dbo.merch_package mp on vmp.merch_package_id = mp.id
                            group by kd.trim_id
                        )
                    )
                    as T
                    where T.year >= 2012 and T.make_id is not null
                    order by make asc
                `)

            const allMakesNormalized = result.map(val => ({make: val.make, make_id: val.make_id}))
            return Promise.resolve(allMakesNormalized);
        } catch (err) {
            return Promise.reject(err);
        }
    } catch(err) {
        return Promise.reject(err);
    }
}

const getAllModelsAndTrimsByMakeAndStartingYear = async (year, make, make_id) => {
    try {
        await sql.init();

        const cp = await sql.pool();
        console.log(`Attempting to fetch all Models and Trims for ${make} starting year ${year} and newer make_id: ${make_id}`);

        const {recordset: result} = await cp.request()
            .query(`
            SELECT distinct v.year, kd.make_id, kd.make, kd.model, kd.model_id, kd.trim, kd.trim_id
                FROM [VehicleMarketDM].[dbo].[kbb_description] kd
                join [VehicleMarketDM].[dbo].[vehicle] v on kd.vehicle_id = v.id
                where v.year >= ${year} and kd.make_id = ${make_id}
                and kd.trim_id is not null
                order by v.year desc, kd.make desc, kd.model desc, kd.trim desc
            `)

            return Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    }
}

const getAllPackagesAndOptionsByMakeAndStartingYear = async (year, make, make_id) => {
    try {
        await sql.init();

        const cp = await sql.pool();
        console.log(`Attempting to fetch all Packages with Options for ${make} starting year ${year} and newer make_id: ${make_id}`);

        const {recordset: result} = await cp.request()
            .query(`
            SELECT distinct v.year, kd.make_id, kd.make, kd.model, kd.model_id, kd.trim, kd.trim_id, mp.id as package_id, mp.package_name, mp.price, mp.reference_count, mo.option_name, mo.id as option_id
                FROM [VehicleMarketDM].[dbo].[merch_package] mp
                join [VehicleMarketDM].[dbo].[kbb_description] kd on mp.kbb_ymmtbe_id = kd.ymmtbe_id
                join [VehicleMarketDM].[dbo].[merch_package_merch_option] mpmo on mp.id = mpmo.merch_package_id
                join [VehicleMarketDM].[dbo].[merch_option] mo on mpmo.merch_option_id = mo.id
                join [VehicleMarketDM].[dbo].[vehicle] v on kd.vehicle_id = v.id
                where v.year >= ${year} and kd.make_id = ${make_id}
                and kd.trim_id is not null
                and mp.price >= 50 and mp.price <= 12000
                order by reference_count desc, package_id, v.year desc, kd.make desc, kd.model desc, kd.trim desc, price desc, option_name asc
            `)

            return Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    }
}

const getAllValueAddOptionsByMakeAndStartingYear = async (year, make, make_id) => {
    try {
        await sql.init();

        const cp = await sql.pool();

        console.log(`Attempting to fetch all Value-Add Options for ${make} by make_id: ${make_id}`)
        const {recordset: result} = await cp.request()
            .query(`
            select distinct Vehicle.year, KBB.make_id, KBB.make, KBB.model_id, KBB.model, KBB.trim_id, KBB.trim, MerchOption.option_name, MerchOption.price, MerchOption.id as option_id,
                (select count(distinct vmo.vehicle_id)
                from vehicle_merch_option vmo
                join merch_option mo on vmo.merch_option_id = mo.id
                join VehicleMarketDM.dbo.kbb_description kbb on mo.kbb_ymmtbe_id = kbb.ymmtbe_id
                where MerchOption.id = mo.id and kbb.make_id = ${make_id}) AS reference_count
            from VehicleMarketDM.dbo.merch_option MerchOption
            join VehicleMarketDM.dbo.kbb_description KBB on MerchOption.kbb_ymmtbe_id = KBB.ymmtbe_id
            join VehicleMarketDM.dbo.vehicle Vehicle on KBB.vehicle_id = Vehicle.id
            where Vehicle.year >= ${year} and KBB.make_id = ${make_id} and MerchOption.kbb_ymmtbe_id like '${year}-${padId(make_id)}%' and MerchOption.is_independently_available = 1 and MerchOption.price > 50 and MerchOption.price <= 6000
            order by Vehicle.year desc, make_id desc, model_id desc, trim_id desc, reference_count desc
            `)
        return Promise.resolve(result);
    } catch (err) {
        return Promise.reject(err);
    }
}

const parseAllTrimsPackages = async (startingYear, make_id, make) => {
    try {

        // This is the static local file stuff for testing/dev.
        // const trimsDataSrc = await fs.readFileSync('./Audi-PO.json','utf8');
        // const trimsData = JSON.parse(trimsDataSrc);

        // const trimsOptionsSrc = await fs.readFileSync('./Audi-O.json','utf8');
        // const trimsOptionsData = JSON.parse(trimsOptionsSrc);


        // This is the live DB query stuff

        console.log(`Retrieving all Models and Trims for ${make} from ${startingYear} by ID: ${make_id}`);
        const allTrims = await getAllModelsAndTrimsByMakeAndStartingYear(startingYear, make, make_id);

        console.log(`Retrieving all Packages for ${make} from ${startingYear} by ID: ${make_id}`);
        const trimsData = await getAllPackagesAndOptionsByMakeAndStartingYear(startingYear, make, make_id);
        console.log(`Packages+Options received for ${make} starting from ${startingYear}`);
        // const trimsData = JSON.parse(trimsSrc);
        
        console.log(`Retrieving all Value-Add Options for ${make} from ${startingYear} by ID: ${make_id}`);
        const trimsOptionsData = await getAllValueAddOptionsByMakeAndStartingYear(startingYear, make, make_id);
        console.log(`Value-Add Options received for ${make} starting from ${startingYear}`);
        // const trimsOptionsData = JSON.parse(trimsOptionsSrc);

        console.log(`Processing for ${make} starting from ${startingYear} starting...`)

        const pipeAllOptionsForPackages = data => pipe(
            groupBy(path(['package_id'])),
            values,
            map(applySpec({
                year: path([0, 'year']),
                make_id: path([0, 'make_id']),
                model_id: path([0, 'model_id']),
                trim_id: path([0, 'trim_id']),
                package_name: path([0, 'package_name']),
                package_id: path([0, 'package_id']),
                price: path([0, 'price']),
                reference_count: path([0, 'reference_count']),
                options: pipe(map(pick(['option_name', 'option_id'])))
            }))
        )(data)

        const addPackagesToTrims = (packagesData, trimsData) => map(trim => {
            const trim_id = path(['trim_id'], trim)

            const make_url_segment = path(['make'], trim).toLowerCase().replace(/[\.\s]/g, '-');
            const model_url_segment = path(['model'], trim).toLowerCase().replace(/[\.\s]/g, '-');
            const trim_url_segment = path(['trim'], trim).toLowerCase().replace(/[\.\s]/g, '-');

            const ymmtId = `${trim.year}-${padId(path(['make_id'], trim))}-${padId(path(['model_id'], trim))}-${padId(path(['trim_id'], trim))}`;

            const baseTrim = Object.assign({}, trim, {make_url_segment, model_url_segment, trim_url_segment, ymmtId});

            const isTrim = n => n.trim_id === trim_id;

            const sortDiff = (a, b) => {return b.reference_count - a.reference_count};

            const packages_src = pipe(filter(isTrim),sort(sortDiff))(packagesData);
            
            const packages_deduped_exact = (packages_src.length)
                ? reducePackagesOptionsByExactDuplicateNames(packages_src)
                : [];
            const packages_deduped = (packages_deduped_exact.length)
                ? reduceCollectionOnSumKeyListKeyWithPossibleDuplicatesByNameKey(packages_deduped_exact, 'package_name', null, 'options')
                : [];
            
            const packages_with_options_reduced = pipe(map(pkg => {
                const {options} = pkg;
                const reducedOptions = reduceCollectionOnSumKeyListKeyWithPossibleDuplicatesByNameKey(options, 'option_name', null, null);
                const newPkg = Object.assign({}, pkg, {options: []});
                newPkg.options.push(...reducedOptions);
                return newPkg;
            }))(packages_deduped);
            
            const packages = map(applySpec({
                package_id: prop('package_id'),
                package_name: prop('package_name'),
                price: prop('price'),
                reference_count: prop('reference_count'),
                additional_reference_counts: prop('additional_reference_counts'),
                additional_package_id_refs: prop('additional_package_id_refs'),
                options: prop('options')
            }))(packages_with_options_reduced);
            return packages
                ? assoc('packages', packages, baseTrim)
                : baseTrim
        }, trimsData)
        
        const addValueAddOptionsToTrims = (optionsData, trimsData) => map(trim => {
            const trim_id = path(['trim_id'], trim)
            const options_src = optionsData.filter((n) => {return n.trim_id == trim_id})
            if(options_src.length){
                const {valueAddOptions} = options_src[0];
                const options_deduped = (valueAddOptions.length) ? reduceCollectionOnSumKeyListKeyWithPossibleDuplicatesByNameKey(valueAddOptions, 'option_name', 'reference_count') : [];
                
                const reducedValueAddOptions = map(applySpec({
                    option_name: prop('option_name'),
                    option_id: prop('option_id'),
                    price: prop('price'),
                    reference_count: prop('reference_count'),
                }))(options_deduped);
                return reducedValueAddOptions
                    ? assoc('valueAddOptions', reducedValueAddOptions, trim)
                    : trim
            } else {
                return trim;
            }
        }, trimsData)

        const pipeAllValueAddOptionsForTrims = valueAddOptionsRaw => pipe(
            groupBy(path(['trim_id'])),
            values,
            map(applySpec({
                year: path([0, 'year']),
                make_id: path([0, 'make_id']),
                model_id: path([0, 'model_id']),
                trim_id: path([0, 'trim_id']),
                valueAddOptions: map(pick(['option_name', 'option_id', 'price', 'reference_count']))
            }))
        )(valueAddOptionsRaw)
        
        const pipeAllBaseLevelModels = trimsData => pipe(
            groupBy(path(['model_id'])),
            values,
            map(applySpec({
                year: path([0, 'year']),
                make: path([0, 'make']),
                make_id: path([0, 'make_id']),
                model: path([0, 'model']),
                model_id: path([0, 'model_id']),
                make_url_segment: path([0, 'make_url_segment']),
                model_url_segment: path([0, 'model_url_segment']),
                packages: path([0, 'packages']),
                valueAddOptions: path([0, 'valueAddOptions'])
            }))
        )(trimsData);

        const addAllPackagesOptionsFromTrimsToModels = (modelsData, allTrimsData) => map(model => {
            
            const model_id = path(['model_id'], model);
            const isModelMatch = propEq('model_id', model_id);
            
            const packages = filter(isModelMatch)(modelsData).map(model => {
                const {packages} = model;
                return packages;
            })

            const flattenedPackages = Array.prototype.concat.apply([], packages);

            const packages_deduped_exact = reducePackagesOptionsByExactDuplicateNames(flattenedPackages);

            const packages_deduped = (packages_deduped_exact.length)
                ? reduceCollectionOnSumKeyListKeyWithPossibleDuplicatesByNameKey(packages_deduped_exact, 'package_name', null, 'options')
                : [];

            const packages_with_options_reduced = pipe(map(pkg => {
                const {options} = pkg;
                const reducedOptions = reduceCollectionOnSumKeyListKeyWithPossibleDuplicatesByNameKey(options, 'option_name', null, null);
                const newPkg = Object.assign({}, pkg, {options: []});
                newPkg.options.push(...reducedOptions);
                return newPkg;
            }))(packages_deduped);
            
            const valueAddOptions = filter(isModelMatch)(modelsData).map(model => {
                const {valueAddOptions} = model;
                return valueAddOptions;
            })

            const flattenedValueAddOptions = Array.prototype.concat.apply([], valueAddOptions);
            
            const filteredVAO = filter(vao => {
                return (vao !== undefined && vao !== 'undefined');
            })(flattenedValueAddOptions)

            const valueAddOptionsDeduped = (filteredVAO.length)
                ? reduceCollectionOnSumKeyListKeyWithPossibleDuplicatesByNameKey(filteredVAO, 'option_name', 'reference_count')
                : [];
            
            const modelWithPO = assoc('packages', packages_with_options_reduced, model);

            const modelWithPOVAO = assoc('valueAddOptions', valueAddOptionsDeduped, modelWithPO);

            const ymmtId = `${modelWithPOVAO.year}-${padId(path(['make_id'], modelWithPOVAO))}-${padId(path(['model_id'], modelWithPOVAO))}`;

            const modelWithYmmtId = assoc('ymmtId', ymmtId, modelWithPOVAO)

            return modelWithYmmtId;

        }, allTrimsData)

        const allOptionsForPackages = pipeAllOptionsForPackages(trimsData);
        
        const allTrimsWithPackages = addPackagesToTrims(allOptionsForPackages, allTrims)
        
        const allValueAddOptionsForTrim = pipeAllValueAddOptionsForTrims(trimsOptionsData);
        
        const allTrimsWithPackagesOptions = addValueAddOptionsToTrims(allValueAddOptionsForTrim, allTrimsWithPackages);
        
        const allBaseModels = pipeAllBaseLevelModels(allTrimsWithPackagesOptions);

        const allBaseModelsWithPackages = addAllPackagesOptionsFromTrimsToModels(allTrimsWithPackagesOptions, allBaseModels);

        const allYmmtPOVAO = concat(allBaseModelsWithPackages, allTrimsWithPackagesOptions);
        
        console.log(`Processing for ${make} starting from ${startingYear} complete. Ready for upserting...`)

        if(allYmmtPOVAO.length) {
            return Promise.resolve(allYmmtPOVAO);
        }


    } catch(e) {
        console.log('there was an error: ', e);
    }
}


const ingestPackagesOptionsModuleDataFromYear = async (startingYear) => {
    try {

        const allMakes = await getAllDistinctMakes();
        // const makeModelTrimsSrc = await fs.readFileSync('./allYMMTs.json','utf8');
        // const makeModelTrims = JSON.parse(makeModelTrimsSrc);
        // const filteredMakes = makeModelTrims.filter(makeModel => (!isNil(makeModel.make) && !isNil(makeModel.make_id))).map(ymmt => ({make:ymmt.make, make_id:ymmt.make_id}))
        // const allMakes = new Array(...new Set(uniqBy(prop('make_id'), filteredMakes)));
        // const allMakes = [{make: 'Chevrolet', make_id: 9}];

        const processMake = async makeData => await parseAllTrimsPackages(startingYear, makeData.make_id, makeData.make);

        const fetchOldTrim = async trim => {
            try {
                const ymmtId = trim.ymmtId;
                const querySpec = ymmtId => ({
                    query: "SELECT * FROM c WHERE c.ymmtId = @ymmtId",
                    parameters: [
                        {
                            name: "@ymmtId",
                            value: ymmtId
                        }
                    ]
                });

                const query = querySpec(ymmtId);
                const {resources} = await cdbContainer.items.query(query).fetchAll();

                return resources[0] || {};
            } catch (err) {
                console.log(err);
            }
        }

        const processModelsTrims = async modelData => {
            try {

                const modelsUpsertLoop = async _ => {
                    try {
                        if(modelData?.length) {
                            for (let i = 0; i < modelData.length; i += 1) {
                                const vehicleModel = await fetchOldTrim(modelData[i]);
                                const updatedVehicleModel = Object.assign({}, vehicleModel, modelData[i]);
                                if(updatedVehicleModel.packages && updatedVehicleModel.packages.length) updatedVehicleModel.packages = updatedVehicleModel.packages.sort((a, b) => a.price - b.price);
                                if(updatedVehicleModel.valueAddOptions && updatedVehicleModel.valueAddOptions.length) updatedVehicleModel.valueAddOptions = updatedVehicleModel.valueAddOptions.sort((a, b) => a.price - b.price);
                                const resources = await cdbContainer.items.upsert(updatedVehicleModel);
                                console.log(`P&O upsert complete for ${modelData[i]['year']} ${modelData[i]['make']} ${modelData[i]['model']} ${modelData[i]['trim'] && modelData[i]['trim']}`)
                            }
                        }

                    } catch (err) {
                        console.log(err);
                    }
                }

                await modelsUpsertLoop();
                
                makeTalley += 1;

                console.log(`Ingestion for make ${makeTalley} of ${allMakes.length} complete.`);
                if(makeTalley == allMakes.length) {
                    console.log('Ingestion complete');
                    console.timeEnd('Ingestion');
                    process.exit(0);
                }

            } catch (err) {
                console.log(err);
            }
        }

        if(allMakes.length) {
            
            const processMakesModelsTrims = pipeWith(tap)([
                map(processMake),
                map(andThen(processModelsTrims))
            ])
            
            processMakesModelsTrims(allMakes)
        }

    } catch (err) {
        return Promise.reject(err);
    }
}

const reducePackagesOptionsByExactDuplicateNames = (collection) => {
    
    const reducedDuplicates = collection.reduce( (accumulator, currentValue) => {

        const indexOfPackageNameInAccumulator = accumulator.findIndex(p => (p.package_name === currentValue.package_name));
    
        const {options} = currentValue;
    
        if(indexOfPackageNameInAccumulator === -1) {
            // console.log('package not in accumulator');
            const {package_id, package_name, price, reference_count} = currentValue;
    
            const newPackageStruct = {package_id, additional_package_id_refs:[], additional_reference_counts: [], package_name, price, reference_count, options:[]};
    
            newPackageStruct.options.push(...options);
    
            accumulator.push(newPackageStruct);
    
        } else if(indexOfPackageNameInAccumulator > -1) {
            // console.log('package IN accumulator');
            const accumulatorItem = accumulator[indexOfPackageNameInAccumulator];
    
            const identical_package_id = accumulatorItem.package_id == currentValue.package_id;
            
            const indexOfPackageIdInRefs = accumulatorItem.additional_package_id_refs.findIndex(p => (p === currentValue.package_id));
            
            if(indexOfPackageIdInRefs === -1 && !identical_package_id) {
            
                accumulatorItem.additional_reference_counts.push(currentValue.reference_count);
            
                accumulatorItem.reference_count += currentValue.reference_count;
            
                accumulatorItem.additional_package_id_refs.push(currentValue.package_id);
            
            } else {
                // console.log('else!!!')
            }
            accumulator[indexOfPackageNameInAccumulator].options.push(...options);
            
        }
        
        return accumulator
    }, [])

    return reducedDuplicates;
}

const reduceCollectionOnSumKeyListKeyWithPossibleDuplicatesByNameKey = (collection, nameKey, sumKey, listKey) => {

    let reducedCollection = [], dictionary = [];

    collection.forEach((item, index, arr) => {
        if(item === undefined || item === 'undefined') return;
        if(!reducedCollection.length) {
            // no Item has been added to the reducedCollection, so add now.
            reducedCollection.push(item);
            dictionary.push(item[nameKey]);
        }else{
            // check for duplicate with mis-spelled name.
            // create a dictionary of all Item.nameKey's currently added to the reduced collection.
            const fs = FuzzySet(dictionary);
            const closeMatches = fs.get(item[nameKey]);    
    
            let hasBeenAddedBasedOnRules = false;
    
            // close matches exist
            if(closeMatches !== null && closeMatches.length > 0) {
                closeMatches.forEach(match => {
                    if(!hasBeenAddedBasedOnRules) {
                        
                        // set probability factor of nearly identical match by string length
                        const itemNameLengthIsIdentical = match[1].length === item[nameKey].length;
                        const matchProbability = match[0];
    
                        // set probability threshold:
                        // str length matches + minimum probability > 0.75
                        // OR
                        // str length does not match + minimum probability > 0.85 
                        const matchProbabilityHigh = (itemNameLengthIsIdentical && matchProbability > 0.75)
                            || (!itemNameLengthIsIdentical && matchProbability > 0.85);
    
                        if(matchProbabilityHigh) {
                            // match probability high, we'll combine this Item's valueKey with the match;
                            const itemIndexInOptionsReduced = reducedCollection.findIndex(p => p[nameKey] === match[1]);
                            const itemMaster = reducedCollection[itemIndexInOptionsReduced];
                            if(sumKey) itemMaster[sumKey] += item[sumKey];
                            if(listKey) itemMaster[listKey].push(...item[listKey]);
                            reducedCollection.splice(itemIndexInOptionsReduced, 1, itemMaster);
                            hasBeenAddedBasedOnRules = true;
                        }else {
                            // match probability is low, safe to push this as a unique Item
                            reducedCollection.push(item);
                            dictionary.push(item[nameKey]);
                            hasBeenAddedBasedOnRules = true;
                        }
                    }
                })                
            } else {
                // no matches at all, this is safe to push as unique Item
                // due to the original reduction of Items by valueKey
                // (determine correct nameKey spelling from popularity)
                reducedCollection.push(item);
                dictionary.push(item[nameKey]);
            }
        }
    })
    return reducedCollection;
}

const begin = async _ => {
    try {
        await sql.init();
        await sql.pool();
        await getCosmosClient().catch(e => console.log(e));
        console.time('Ingestion');
        await ingestPackagesOptionsModuleDataFromYear(2012).catch(e => console.log(e));
        
    } catch (err) {
        console.log(err);
    }
}

begin();

