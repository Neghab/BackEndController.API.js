import * as utils from './utils';
import * as Services from './services';

import {
    envVariables,
    configureServer,
    configureLoggers
} from './config';

const appdynamics = require('appdynamics');

const {
    PORT,
    environment,
    appDynamicsHost,
    appDynamicsPort,
    appDynamicsSSL,
    appDynamicsAccount,
    appDynamicsTier,
    appDynamicsApp,
    appDynamicsKey,
    appDynamicsNode,
} = envVariables;

appdynamics.profile({
    controllerHostName: appDynamicsHost,
    controllerPort: appDynamicsPort,
    controllerSslEnabled: appDynamicsSSL,
    accountName: appDynamicsAccount,
    accountAccessKey: appDynamicsKey,
    applicationName: appDynamicsApp,
    tierName: appDynamicsTier,
    nodeName: appDynamicsNode,
});

process.on('unhandledRejection', (reason) => {
    console.log(`========= unhandledRejection - Reason ======= ${reason}`);
});

process.on('uncaughtException', (exception) => {
    console.log(`========= unhandledRejection - Exception ======= ${exception}`);
});


const initializeServer = async () => {
    const appServices = await configureServer(utils.functions, Services);
    const { expressInstance, serviceLoggers: { applicationLogger } } = appServices;
    expressInstance.listen(PORT, () => {
        applicationLogger({
            level: 'info', message: `Node Template [environment: ${environment}] has been initialized on port: [${PORT}]`
        });
    })
};

try {
    initializeServer();
}
catch (err) {
    console.log(err);
}
