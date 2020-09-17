import {logAndReturn} from '../logger';

export const helloRoutes = router => {

  router.get('/hello', async (req, res) => {
    try {
      return logAndReturn('hello', res, 200, 'hello');
    } catch (err) {
      return logAndReturn('goodbye!', res, 500, err);
    }
  });

  return router;
}
