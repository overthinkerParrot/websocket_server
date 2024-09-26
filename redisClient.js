const Redis = require('ioredis');
require('dotenv').config();

class RedisClient {
    constructor() {
        this.redis = new Redis(process.env.REDIS_SERVICE_URI);
    }

    async connect(sessionID) {
        await this.redis.set(sessionID, 1);
        
        let currentCount = await this.redis.get('count');
        currentCount = currentCount ? parseInt(currentCount) : 0; 
        
        await this.redis.set('count', currentCount + 1); 
    }

    async disconnect(sessionID) {
        await this.redis.set(sessionID, 0); 
        let currentCount = await this.redis.get('count');
        currentCount = currentCount ? parseInt(currentCount) : 0; 
        
        await this.redis.set('count', currentCount-1);
    }

    async find(sessionID) {
        const found = await this.redis.get(sessionID);  
        return found === '1';  
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
