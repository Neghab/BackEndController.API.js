import {configureLoggers} from './loggers';
import {configureExpressInstance} from './express';
import {envVariables as environmentVariables} from './env.variables';
import { CosmosDBService } from '../services/cosmosdb';
import {sendSplunkLogMessage} from './logger';

const {
  encryptedSample,
  CVNA_APP_COSMOSDB_CONN_STRING_ENCRYPTED
} = environmentVariables;

const instantiateLoggers = config => {
  const {
    splunkURL,
    splunkToken,
    splunkIndex,
    splunkLogLevel,
} = environmentVariables

  const loggers = configureLoggers({
    splunkURL,
    splunkToken,
    splunkIndex,
    splunkLogLevel
  });


  return {
    ...config,
    appServices: {
      ...config.appServices,
      serviceLoggers: { ...loggers }
    }
  }
}

const decyptSettings = async config => {
  const { DecryptWrapper, appServices: { serviceLoggers: { applicationLogger } } } = config

  const decryptutil=new DecryptWrapper({
    inputs: {
      "hello_world": encryptedSample,
      "cosmos": CVNA_APP_COSMOSDB_CONN_STRING_ENCRYPTED
    }
  });

  try {
    const _decryptedValues = await decryptutil.init().then(async () => {
      try {
        applicationLogger({ level: 'info', message: 'Initializing Decryption...' })
        const [
          decryptedHelloWorld,
          decryptedCosmosDBConnectionString
        ] = await Promise.all([
          // TODO: possibly remove hello world once we verify certs are present and working in prod
          decryptutil.decryptHelloWorld().catch(e=> console.log('silent')),
          decryptutil.decryptCosmosDBConnectionString(),
        ]).catch(error=>{
          sendSplunkLogMessage(`error decrypting: ${error}`);
          console.log(error);
        });

        applicationLogger({ level: 'info', message: 'Decryption Completed.' })
        sendSplunkLogMessage(`helloworld = ${decryptedHelloWorld}`);
        console.log(decryptedHelloWorld);

        if(!decryptedCosmosDBConnectionString){
          sendSplunkLogMessage(`could not decrypt cosmosdb connection}`);
        }

        return {
          decryptedValues: {
            decryptedHelloWorld,
            decryptedCosmosDBConnectionString
          }
        };
      } catch (error) {
        applicationLogger({ level: 'error', message: JSON.stringify(error) });
        console.log(error);

        return null;
      }
    });
    return {
      ...config,
      appServices: {
        ...config.appServices,
        ..._decryptedValues
      }
    }
  }
  catch (err) {
    sendSplunkLogMessage(`error decrypting certs: ${error}`)
    console.log(error);
    serviceLoggers.applicationLogger({ level: 'error', message: JSON.stringify(error) });
    return config;
  }
};

const instantiateCosmosDBClient = async config => {
  const { CarvanaCache, appServices: { serviceLoggers, decryptedValues } } = config
  const { decryptedCosmosDBConnectionString } = decryptedValues;

  const db = new CosmosDBService({ decryptedCosmosDBConnectionString });
  const _client = await db.init();

  // don't await just let it ride
  // bootstrapDB();

  return {
    ...config,
    appServices: {
      ...config.appServices,
    }
  }
}

const initInMemoryCacheInstance = config => {
  const { CarvanaInMemoryCache, appServices: { serviceLoggers: { applicationLogger } } } = config;
  const inMemoryCacheService = new CarvanaInMemoryCache({ applicationLogger });
  applicationLogger({ level: 'info', message: 'In-Memory Cache Instance Has Been Initialized.' });

  return {
    ...config,
    appServices: {
      ...config.appServices,
      inMemoryCacheService
    }
  }
};

const setInMemoryCacheValues = async (config = {}) => {
  try {
    const { appServices: { inMemoryCacheService, decryptedValues, serviceLoggers: { applicationLogger } } } = config
    applicationLogger({ level: 'info', message: 'Adding Records To In-Memory Cache...' });
    await inMemoryCacheService.setMultiKeyCache(decryptedValues)

    return config;
  } catch (err) {
    applicationLogger({ level: 'error', message: JSON.stringify(err) });
    return null;
  }
};


export const configureServer = async (utils, services) => {
  const { composeAsync } = utils;

  try {
    const config = await composeAsync(
      configureExpressInstance,
      setInMemoryCacheValues,
      initInMemoryCacheInstance,
      instantiateCosmosDBClient,
      decyptSettings,
      instantiateLoggers,
      () => services
      );
    const { appServices: { serviceLoggers: { applicationLogger } } } = config
    applicationLogger({ level: 'info', message: 'Service Composition Is Complete.' });
    return config.appServices
  }
  catch (err) {
    console.log(err)
    applicationLogger({ level: 'error', message: JSON.stringify(err) });
  }
}
