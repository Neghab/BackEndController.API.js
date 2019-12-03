import redis from 'redis';
import bluebird from 'bluebird';

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const TWO_WEEKS = (7 * 24 * 60 * 60);

export class CarvanaRedisWrapper {
    constructor(connection){
        this.init = this.init.bind(this);
        this._connection = connection;
        this._redisClient = null;
    }

    async init() {
        if(this._redisClient === null){
          try{
            const {
              CARVANA_APP_REDIS_URI,
              CARVANA_APP_REDIS_PORT,
              CARVANA_APP_AZURE_VAULT_REDIS_SECRET_NAME,
              CARVANA_APP_AZURE_VAULT_REDIS_SECRET_VERSION,
              getSecret
            } = this._connection;
            const CARVANA_APP_REDIS_SECRET = await getSecret({secretName:CARVANA_APP_AZURE_VAULT_REDIS_SECRET_NAME, secretVersion:CARVANA_APP_AZURE_VAULT_REDIS_SECRET_VERSION});
            console.log(CARVANA_APP_REDIS_SECRET)
            
            this._redisClient = await redis.createClient(CARVANA_APP_REDIS_PORT, CARVANA_APP_REDIS_URI, {
              auth_pass: CARVANA_APP_REDIS_SECRET,
              tls: { servername: CARVANA_APP_REDIS_URI }
            });
            return this._redisClient;
          } catch(err) {
            console.error(err);
          }
        }
        
        return this._redisClient;
    }

    async getAsync(key) {
        try {
            const response = await this._redisClient.getAsync(key);
            return response;
        } catch (err) {
            console.log(err);
            return err;
        }        
    }

    async setAsync(key, value) {
        try {
            const response = await this._redisClient.setAsync(key, value, 'NX', 'EX', TWO_WEEKS);
            return response;
        } catch (err) {
            console.log(err);
            return err;
        }        
    }

    async flushAll() {
        try {
            const response = await this._redisClient.flushall();
            console.log(response);
            return response;
        } catch (err) {
            return err;
        }
    }
}

