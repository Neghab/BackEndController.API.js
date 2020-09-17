import packagesOptionsController from './packagesoptions.controller';

export const packagesOptionsRoutes = (router) => {
  router
    .route('/packagesoptions')
    .get(packagesOptionsController.getPackagesOptionsByYMM);

  router
    .route('/packagesoptions/test')
    .get(packagesOptionsController.queryTest);


  return router;
};
