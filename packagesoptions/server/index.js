import express from 'express';
import cors from 'cors';
// import {createHandler} from 'azure-function-express';
import {restRouter} from './api';
import {sendSplunkLog, logAndReturn} from './logger';
import config from './config/config';

const {CVNA_APP_APP_INSIGHTS_KEY} = config;

const app = express();
const PORT = process.env.PORT || process.argv[2] || 5997;

const appInsights = require('applicationinsights');

sendSplunkLog('server started');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));


appInsights
  .setup(`${CVNA_APP_APP_INSIGHTS_KEY}`)
  .setAutoDependencyCorrelation(false)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .start();

app.use('/api', restRouter);

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.message = 'Invalid route';
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  // res.status(error.status || 500);
  return logAndReturn(error.message, res, error.status, error, req);
});

app.listen(PORT, () => {
  console.log(`Server is running at PORT http://localhost:${PORT}`);
});

