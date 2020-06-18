import {isNil} from 'ramda';

import {CarvanaKeyVault} from '../../../config/CarvanaKeyVault';
import {CarvanaCosmosWrapper} from '../../../config/CarvanaCosmosWrapper';
import {logAndReturn} from '../../../logger';
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
      const {year, make, model, trim} = req.query;
      console.log(year,make,model);
      if(isNil(year) || isNil(make) || isNil(model)) return logAndReturn("Some YMM query params missing", res, 400, emptyResponse, req.params);
      console.log('got here from query');
      try{
        let query = "SELECT * FROM c WHERE c.year=@year and c.make_url_segment=@make and c.model_url_segment=@model";
        
        let parameters = [
          {
            name: "@year",
            value: parseInt(year)
          },
          {
            name: "@make",
            value: `${String(make).toLowerCase()}`
          },
          {
            name: "@model",
            value: `${String(model).toLowerCase()}`
          }
        ];
        
        
        if (trim !== undefined && trim !== null) {
          query += " and c.trim_url_segment = @trim";
          parameters.push({
            name: "@trim",
            value: String(trim).toLowerCase()
          })
        } else {
          query += " and not is_defined(c.trim_url_segment)";
        }

        const packagesOptionsByYMMQuerySpec = {
          query,
          parameters
        };
        
        const cosmosResponse = await cosmosClient.query(packagesOptionsByYMMQuerySpec);
        
        const {resources} = cosmosResponse;
        console.log(resources);
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
