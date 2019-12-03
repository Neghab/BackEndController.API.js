import express from 'express';
import helloController from './hello.controller';

export const helloRouter = express.Router();

helloRouter
  .route('/')
  .get(helloController.sayHello);
