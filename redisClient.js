const Redis = require('ioredis');
require('dotenv').config();

class RedisClient {
    constructor() {
        this.redis = new Redis(process.env.REDIS_SERVICE_URI);
    }

    async connect(sessionID) {
        await this.redis.set(sessionID, 1);
        await this.redis.incr('count');
    }

    async disconnect(sessionID) {
        await this.redis.set(sessionID, 0);
        await this.redis.decr('count');
    }

    async find(sessionID) {
        const found = await this.redis.get(sessionID);
        if(found){
            return true;
        }
        return false;
    }

    async getCount() {
        const count = await this.redis.get('count');
        return count ? parseInt(count) : 0;
    }

    async clear() {
        await this.redis.flushall();
    }
}

module.exports = RedisClient;
