import { functions } from '../../utils';

import {healthRoutes} from './health';
import {helloRoutes} from './hello';
import {protectedRoutes} from './protected';
import {packagesOptionsRoutes} from './packagesoptions';

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');


const getSwaggerDocumentationRoute = router => {
    router.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        explorer: true,
    }));

    return router;
}


const APP_ROUTER = functions.compose(
    getSwaggerDocumentationRoute,
    helloRoutes,
    packagesOptionsRoutes,
    healthRoutes,
    protectedRoutes
    );

export const appRouter = router => {
    const localAppRouter = APP_ROUTER(router);

    return localAppRouter;
};




