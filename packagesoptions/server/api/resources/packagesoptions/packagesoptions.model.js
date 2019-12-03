import Joi from '@hapi/joi';

export const PackagesOptionsSchema = Joi.object().keys({
  
});


export const PackagesOptionsResultItem = input => {
  const vehicle = input._source;
  return {
    ...vehicle
  }
};
