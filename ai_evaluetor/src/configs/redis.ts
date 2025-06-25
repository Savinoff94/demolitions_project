import { Redis } from 'ioredis'
import { Queue } from 'bullmq'
import {
    ParsingQueueData,
    AiEvaluetionQueueData,
    ResultsQueueData,
    RedisCacheSchema,
    RedisKey
} from '../types/types'

export const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null,
})

export const typedRedis = {
    set: async function <K extends RedisKey>(key: K, value: RedisCacheSchema[K], cacheTimeSeconds: number) {
        await redisClient.set(key, JSON.stringify(value), 'EX', cacheTimeSeconds);
    },

    get: async function <K extends RedisKey>(key: K) {
        const val = await redisClient.get(key)
        return val ? JSON.parse(val) as RedisCacheSchema[K] : null
    },

    keyExists: async function <K extends RedisKey>(key: K) : Promise<boolean> {
        const val = await redisClient.exists(key)
        return Boolean(val)
    },

    expire: async function <K extends RedisKey>(key: K, seconds: number) : Promise<void> {
        await redisClient.expire(key, seconds)
    },
    
    del: async function <K extends RedisKey>(key: K) : Promise<void> {
        await redisClient.del(key)
    }
}

export const parsingQueue = new Queue<ParsingQueueData>('parsingQueue', {
    connection: redisClient,
})

export const aiEvaluationQueue = new Queue<AiEvaluetionQueueData>('aiEvaluationQueue', {
    connection: redisClient,
})

export const resultsQueue = new Queue<ResultsQueueData>('resultsQueue', {
    connection: redisClient,
})

redisClient.on('connect', () => console.log('Connected to Redis'))
redisClient.on('error', (err) => console.error('Redis error:', err))
