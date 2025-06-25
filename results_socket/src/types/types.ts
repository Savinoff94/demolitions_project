export type Address = {
    city: string,
    street: string,
    building: number,
}
  
  //QUEUES
export type ParsingQueueData = {
    fullAddress: string
} & Address
  
export type AiEvaluetionQueueData = {
    data: Record<string, string>[][]
} & ParsingQueueData
  
export type ResultsQueueData = {
    fullAddress: string
    message: string,
    mark: number
} & Address
  
//CACHE
export type RedisCacheSchema = {
    [key: `pending:${string}`]: boolean;
    [key: `cache:${string}`]: ResultsQueueData;
};

export type RedisKey = keyof RedisCacheSchema

export const redisKeys = {
    pending: (id: string) => `pending:${id}` as const,
    cache: (id: string) => `cache:${id}` as const,
};