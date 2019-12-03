import {logAndReturn} from '../../../logger';

export default {
  async sayHello(req, res) {
    try {
      return logAndReturn('hello', res, 200, 'hello');
    } catch (err) {
      return logAndReturn('goodbye!', res, 500, err);
    }
  },
};
