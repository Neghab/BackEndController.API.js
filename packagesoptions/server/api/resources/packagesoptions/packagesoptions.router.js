import express from 'express';
import packagesOptionsController from './packagesoptions.controller';

export const packagesOptionsRouter = express.Router();

packagesOptionsRouter
  .route('/')
  .get(packagesOptionsController.getPackagesOptionsByYMM);

packagesOptionsRouter
  .route('/test')
  .get(packagesOptionsController.queryTest);