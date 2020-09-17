import {configureLoggers} from './loggers';
import {configureExpressInstance} from './express';
import {envVariables as environmentVariables} from './env.variables';
import {sendSplunkLogMessage} from './logger';

const fs = require('fs');

const {
  redisEncryptedConnectionString,
  encryptedSample
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
      // "redis": redisEncryptedConnectionString
    }
  });

  try {
    const _decryptedValues = await decryptutil.init().then(async () => {
      try {
        applicationLogger({ level: 'info', message: 'Initializing Decryption...' })
        const [
          decryptedHelloWorld,
          // decryptedRedisConnectionString
        ] = await Promise.all([
          decryptutil.decryptHelloWorld(),
          // decryptutil.decryptRedis(),
        ]);

        applicationLogger({ level: 'info', message: 'Decryption Completed.' })

        console.log(decryptedHelloWorld);

        return {
          decryptedValues: {
            decryptedHelloWorld,
            // decryptedRedisConnectionString
          }
        };
      } catch (error) {
        applicationLogger({ level: 'error', message: JSON.stringify(error) });
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
    serviceLoggers.applicationLogger({ level: 'error', message: JSON.stringify(error) });
  }
};

// const instantiateRedisClient = async config => {
//   const { CarvanaCache, appServices: { serviceLoggers, decryptedValues } } = config
//   const { decryptedRedisConnectionString } = decryptedValues;

//   const _client = new CarvanaCache({ decryptedRedisConnectionString, serviceLoggers }).init();

//   return {
//     ...config,
//     appServices: {
//       ...config.appServices,
//       asyncRedisClient: _client
//     }
//   }
// }

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
      // instantiateRedisClient,
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
