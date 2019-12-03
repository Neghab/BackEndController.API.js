import express from 'express';
import { packagesOptionsRouter } from './resources/packagesoptions';
import { helloRouter } from './resources/hello';

export const restRouter = express.Router();
restRouter.use('/packagesoptions', packagesOptionsRouter);
restRouter.use('/hello', helloRouter);
