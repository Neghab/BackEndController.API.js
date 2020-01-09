import dotenv from 'dotenv';
import path from 'path';

const getConfig = () => {
  try{
    if(process.env.NODE_ENV) {
      return dotenv.config({path:path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`)}).parsed;
    }
  }catch(err){
    throw err;
  }
  return null;
}

export default getConfig();
  