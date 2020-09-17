
const NodeCache = require('node-cache');

export class CarvanaInMemoryCache {

    constructor(config = {}) {
        this._memCache = new NodeCache();
        this.setCacheByKey = this.setCacheByKey.bind(this);
        this.setMultiKeyCache = this.setMultiKeyCache.bind(this);
        this.retrieveFromCacheByKey = this.retrieveFromCacheByKey.bind(this);
        this.logger = config.applicationLogger;
    }

    async setCacheByKey(key = '', val) {
        try {
            return this._memCache.set(key, val, (err, success) => {
                if (err) throw new Error(err);

                if (success) {
                    this.logger({ level: 'info', message: `value for ${key} has been added to in-memory cache` });
                }
                return success;
            });
        } catch (error) {
            this.logger({ level: '1error', message: JSON.stringify(error) });
        }
    }

    // TODO: figureout what to do with throws
    async setMultiKeyCache(keyVals = {}) {

        return Object.keys(keyVals).forEach(x => {
            const key = x;
            const val = keyVals[x];

            if (!key || !val) return;

            try {
                return this._memCache.set(key, val, (err, success) => {
                    if (err) throw new Error(err);

                    if (success) {
                        this.logger({ level: 'info', message: `value for ${key} has been added to in-memory cache.` });
                    }

                    return success;
                });
            } catch (error) {
                this.logger({ level: '2error', message: JSON.stringify(error) });
            }
        });
    }

    retrieveFromCacheByKey(key = "") {
        try {
            const data = this._memCache.get(key);

            return data;
        } catch (error) {
            this.logger({ level: '3error', message: JSON.stringify(error) });
        }
    }

    async deleteFromByCache(key = "") {
        return this._memCache.del(key, (err, count) => {
            if (err) {
                this.logger({ level: '4error', message: JSON.stringify(err) });
            }

            return count;
        });
    }

    async getAllCacheValues() {
        return this._memCache.keys((err, keys) => {
            if (err) {
                this.logger({ level: '5error', message: JSON.stringify(err) });
            }

            return keys;
        });
    }
}

