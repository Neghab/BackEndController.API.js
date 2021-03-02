import {isNil} from 'ramda';

import {DBInstance} from '../../../config/CarvanaCosmosWrapper';

import {logAndReturn} from '../../logger';

// const capitalize = s => {
//   if (typeof s !== 'string') return ''
//   return s.charAt(0).toUpperCase() + s.slice(1)
// }
const messages = {
  someYMM: "Some YMM query params missing",
  successYMM: "PackagesOptions YMM Success",
  successTestYMM: "PackagesOptions YMM **TEST** Success",
};

const queries = {
  ymm: "SELECT * FROM c WHERE c.year=@year and c.make_url_segment=@make and c.model_url_segment=@model",
  test: "SELECT * FROM c where c.year=2019 and c.make='Audi' and c.model='A4'"
};

const getParameters = (year, make, model) => ([
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
]);

export default {
  async getPackagesOptionsByYMM(req, res) {
    const emptyResponse = {};

    try {
      const {year, make, model, trim} = req.query;

      if(isNil(year) || isNil(make) || isNil(model)) {
        return logAndReturn(messages.someYMM, res, 400, emptyResponse, req.params);
      }

      try{
        let query = queries.ymm;

        let parameters = getParameters(year, make, model);


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

        const db = DBInstance.instance;

        const cosmosResponse = await db.query(packagesOptionsByYMMQuerySpec);

        const {resources} = cosmosResponse;

        return logAndReturn(messages.successYMM, res, 200, resources, {query: req.params, cosmosResponse});
      }catch(err){
        return logAndReturn(err, res, 400, emptyResponse, req);
      }
    } catch (err) {
        return logAndReturn(`Critical Error: ${err}`, res, 500, err, req);
    }
  },

  async queryTest(req, res) {
    const emptyResponse = {};
    let response = emptyResponse;

    try {
      const {year, make, model} = req.params;

      if(isNil(year) || isNil(make) || isNil(model)) {
        return logAndReturn(messages.someYMM, res, 400, response, req.params);
      }

      try{

        const packagesOptionsByYMMQuerySpec = {
          query: queries.test
        };

        const db = DBInstance.instance;

        response = await db.query(JSON.stringify(packagesOptionsByYMMQuerySpec));

        return logAndReturn(messages.successTestYMM, res, 200, response, req.params)
      }catch(err){
        return logAndReturn(err, res, 400, response, req);
      }
    } catch (err) {
      return logAndReturn(`Critical Error: ${err}`, res, 500, err, req);
    }
  }
};
