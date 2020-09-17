const cors = require('cors');
const helmet = require('helmet');
const uuidv4 = require('uuid/v4');
const express = require('express');
const compress = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
import {envVariables as environmentVariables} from './env.variables';
import {appRouter} from './routes';
const middlewares = require('./middlewares');

const {
  splunkURL,
  splunkToken,
  splunkIndex,
} = environmentVariables;

const m = middlewares.default({
  splunk: {
    splunkURL,
    splunkToken,
    splunkIndex,
  },
  generateID: uuidv4
});

export const configureExpressInstance = (config = {}) => {
  const expressInstance = express();
  const router = express.Router();
  const appRoutes = appRouter(router);

  expressInstance.use(cors());
  expressInstance.use(helmet());
  expressInstance.use(compress());
  expressInstance.use(cookieParser());
  expressInstance.use(methodOverride());

  expressInstance.use(bodyParser.urlencoded({ extended: true }));
  expressInstance.use(m.requestSetup);
  expressInstance.use(m.splunk);
  expressInstance.use(m.authError);
  expressInstance.use('/api', appRoutes);

  return {
    ...config,
    appServices: {
      ...config.appServices,
      expressInstance
    }
  };
}
