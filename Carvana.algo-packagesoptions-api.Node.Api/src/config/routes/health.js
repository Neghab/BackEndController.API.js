
export const healthRoutes = router => {
  router.get('/v1/liveness', async (req, res) => res.sendStatus(200));
  router.get('/v1/readiness', async (req, res) => res.sendStatus(200));

  // TODO readiness cannot just be a 200 and should in fact reflect the state of the app

  return router;
}
