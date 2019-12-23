import Joi from '@hapi/joi';
import {compose, filter, map, into, isNil, isEmpty} from 'ramda';
import {pathOr} from '@carvana/futilities';
// import cache from 'memory-cache';
import atob from 'atob';

import {CarvanaKeyVault} from '../../../config/CarvanaKeyVault';
import {CarvanaCosmosWrapper} from '../../../config/CarvanaCosmosWrapper';
import {logAndReturn, sendSplunkLog} from '../../../logger';
import config from '../../../config/config';

const keyvault = new CarvanaKeyVault(config);
keyvault.init();

const cosmosClient = new CarvanaCosmosWrapper({getSecret: keyvault.getSecret, ...config})
cosmosClient.init();

const capitalize = s => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default {
  async getPackagesOptionsByYMM(req, res) {
    const emptyResponse = {};
    try {
      const {year, make, model} = req.query;
      if(isNil(year) || isNil(make) || isNil(model)) return logAndReturn("Some YMM query params missing", res, 400, emptyResponse, req.params);

      try{

        const packagesOptionsByYMMQuerySpec = {
          query: "SELECT * FROM c WHERE c.year=@year and c.make=@make and c.model=@model",
          parameters: [
            {
              name: "@year",
              value: parseInt(year)
            },
            {
              name: "@make",
              value: `${capitalize(make)}`
            },
            {
              name: "@model",
              value: `${capitalize(model)}`
            }
          ]
        };

        const cosmosResponse = await cosmosClient.query(packagesOptionsByYMMQuerySpec);
        const {resources} = cosmosResponse;
            
        return logAndReturn("PackagesOptions YMM Success", res, 200, resources, {query: req.params, cosmosResponse});
      }catch(err){
        return logAndReturn(err, res, 400, emptyResponse, req);
      }
    } catch (err) {
      return logAndReturn(`Critical Error: ${err}`, res, 500, err, req);
    }
  },

  async queryTest(req, res) {
    console.log('test');
    const emptyResponse = {};
    let response = emptyResponse;
    try {
      const {year, make, model} = req.params;
      if(isNil(year) || isNil(make) || isNil(model)) return logAndReturn("Some YMM query params missing", res, 400, response, req.params);

      try{
        
        const packagesOptionsByYMMQuerySpec = {
          query: "SELECT * FROM c where c.year=2019 and c.make='Audi' and c.model='A4'"
        };
        console.log('the query from the controller: ', packagesOptionsByYMMQuerySpec)
        response = await cosmosClient.query(JSON.stringify(packagesOptionsByYMMQuerySpec));
        return logAndReturn("PackagesOptions YMM **TEST** Success", res, 200, response, req.params)
      }catch(err){
        return logAndReturn(err, res, 400, response, req);
      }
    } catch (err) {
      return logAndReturn(`Critical Error: ${err}`, res, 500, err, req);
    }
  }
};
