import express from 'express';
import packagesOptionsController from './packagesoptions.controller';

export const packagesOptionsRouter = express.Router();

packagesOptionsRouter
  .route('/:year/:make/:model')
  .get(packagesOptionsController.getPackagesOptionsByYMM);

packagesOptionsRouter
  .route('/test')
  .get(packagesOptionsController.queryTest);