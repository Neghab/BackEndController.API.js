const redis = require('redis');
const bluebird = require('bluebird')

export class CarvanaCache {
    constructor(config) {

        const { decryptedRedisConnectionString, serviceLoggers: { applicationLogger } } = config;
        this.logger = applicationLogger;
        this.init = this.init.bind(this);
        this.config = decryptedRedisConnectionString;
    }

    init() {
        const { port, host, password } = this.config;

        const _cacheClient = redis.createClient(port, host, {
            auth_pass: password,
            tls: { servername: host }
        });

        this._asyncCacheClient = bluebird.promisifyAll(_cacheClient);

        this._asyncCacheClient.on("connect", () => { });
        this._asyncCacheClient.on("error", err => this.logger({
            level: 'error', message: JSON.stringify(err)
        }));
        this.cacheExpirationPeriod = 300;

        return this._asyncCacheClient;
    }

    async get_by_key(key) {
        const cached_data = await this._asyncCacheClient.getAsync(key).then(async res => JSON.parse(res)).catch(err => { });
        return cached_data;
    }

    async set_by_key(key, payload) {
        try {
            this._asyncCacheClient.setexAsync(
                key,
                this.cacheExpirationPeriod,
                JSON.stringify(payload)
            );
        }
        catch (err) {
            // TODO: hadnle error
        }
    }
    }

