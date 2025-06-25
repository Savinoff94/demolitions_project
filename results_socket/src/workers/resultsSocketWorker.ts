import dotenv from 'dotenv'
dotenv.config()
import { Worker } from 'bullmq'
import { redisClient, typedRedis } from '../configs/redis'
import { WebSocket, RawData } from 'ws'
import { ResultsQueueData } from '../types/types'

type ExtendedWebSocket = {
    subscriptions: Set<string>;
} & WebSocket

const subscriptions = new Map<string, Set<ExtendedWebSocket>>();
const wss = new WebSocket.Server({ port: process.env.WEB_SOCKET_PORT ? Number(process.env.WEB_SOCKET_PORT) : 8080 });

wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log("CONNECTION")
    ws.subscriptions = new Set();

    ws.on('message', async (data: RawData) => {
        try {
            const message = JSON.parse(data.toString()) as {
                action: 'subscribe' | 'unsubscribe';
                key: string;
            };
            const {action, key} = message

            if (action === 'subscribe') {
                //TODO just check cache, remove result: key, remove logic from sending results function 
                const isDataWaitForSubscriber = await typedRedis.keyExists(`cache:${key}`)
                if(isDataWaitForSubscriber) {
                    console.log('data is gotten earlier than connectied to client socket')
                    const res = await typedRedis.get(`cache:${key}`)
                    console.log('sending response', res)
                    ws.send(JSON.stringify({ key, data: res }))
                    return 
                }
                if(!subscriptions) {
                    throw new Error('no subscriptions')
                }
                if (!subscriptions.has(key)) {
                    subscriptions.set(key, new Set())
                }
                const usersSet = subscriptions.get(key)
                if(!usersSet) {
                    throw new Error('no usersSet')
                }
                usersSet.add(ws)
                ws.subscriptions.add(key)
                console.log("SUBSCRIBED " + key)
            }

            if (action === 'unsubscribe') {
                subscriptions.get(key)?.delete(ws)
                ws.subscriptions.delete(key)
                console.log("UNSUBSCRIBED " + key)
            }

        } catch (err) {
            console.error('Bad message:', data)
        }
    })

    ws.on('close', () => {
        for (const key of ws.subscriptions) {
            subscriptions.get(key)?.delete(ws)
        }
    })
})

function sendToSubscribers(key: string, data: ResultsQueueData) {
    const message = JSON.stringify({ key, data });
    const subs = subscriptions.get(key) || new Set();
  
    for (const client of subs) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                console.log('sending response', message)
                client.send(message);
            } catch (err) {
                subs.delete(client)
                console.error(`Failed to send to client`, err);
            }
        }
    }
}

const worker = new Worker(
    'resultsQueue',
    async (job) => {
        const evaluetedData = job.data as ResultsQueueData
        console.log(job.data)
        sendToSubscribers(evaluetedData.fullAddress, evaluetedData)
    },
    { connection: redisClient, autorun: true }
)

export default worker