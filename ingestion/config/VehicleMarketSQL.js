import * as sql from 'mssql';
import parse from 'mssql-connection-string';

export class VehicleMarketSQL {
    constructor(config){
        this.init = this.init.bind(this);
        this.pool = this.pool.bind(this);
        this._config = config;
        this._pool = null;
        
        
        sql.on('error', err => {
            console.log(`SQL Error : ${err}`);
        })
        

    }

    async pool() {
        return this._pool;
    }

    async init() {
        if(this._pool === null){
            const pool = await new sql.ConnectionPool(this._config).connect().then(thePool => thePool);
            if(pool) console.log('pool!');
            this._pool = pool;
            return this._pool;
        }
        
        return this._pool;
    }
}

