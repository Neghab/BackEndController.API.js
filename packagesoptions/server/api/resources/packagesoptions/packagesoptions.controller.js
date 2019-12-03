import Joi from '@hapi/joi';
import {compose, filter, map, into, isNil, isEmpty} from 'ramda';
import {pathOr} from '@carvana/futilities';
// import cache from 'memory-cache';
import atob from 'atob';

import {CarvanaKeyVault} from '../../../config/CarvanaKeyVault';
// import {PackagesOptionsSchema} from './packagesoptions.model';
import {logAndReturn, sendSplunkLog} from '../../../logger';
import config from '../../../config/config';

const keyvault = new CarvanaKeyVault(config);
keyvault.init();



export default {
  async getPackagesOptionsByYMM(req, res) {
    const emptyResponse = {};

    try {
      const {year, make, model} = req.params;
      if(isNil(year) || isNil(make) || isNil(model)) return logAndReturn("Some YMM query params missing", res, 400, emptyResponse, req.params);

      try{
        console.log('this is a thing');
      }catch(err){
        return logAndReturn(err, res, 400, emptyResponse, req);
      }
    } catch (err) {
      return logAndReturn(`Critical Error: ${err}`, res, 500, err, req);
    }
    return emptyResponse;
  }
};
