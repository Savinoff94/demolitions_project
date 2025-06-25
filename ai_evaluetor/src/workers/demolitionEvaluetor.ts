import dotenv from 'dotenv'
dotenv.config()
import OpenAI from 'openai/index.mjs'
import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod'
import { Worker } from 'bullmq'
import { redisClient, resultsQueue, typedRedis } from '../configs/redis'
import { getRandomInt } from '../helpers'
import AddressInfo from '../models/AddressInfo'
import { AiEvaluetionQueueData } from '../types/types.js'

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const dummyVariants = [
    {
        message: '0',
        mark: 0,
    },
    {
        message: '1',
        mark: 1,
    },
    {
        message: '2',
        mark: 2,
    },
]

const worker = new Worker(
    'aiEvaluationQueue',
    async (job) => {
        console.log('aiEvaluationQueue RUNNING')

        if (process.env.IS_DUMMY_DATA === 'true') {
            console.log("INSIDE DUMMY PIPELINE")

            try {
                const { fullAddress, city, building, street } = job.data as AiEvaluetionQueueData
                const index = getRandomInt(2)
                const dummyResult = dummyVariants[index]
                await resultsQueue.add(fullAddress, {fullAddress, ...dummyResult})
                const newAddressInfo = new AddressInfo({
                    ...dummyResult,
                    city,
                    building,
                    street,
                    fullAddress,
                })
                await newAddressInfo.save()
                await typedRedis.set(`cache:${fullAddress}`, {
                    ...dummyResult,
                    city,
                    building,
                    street,
                    fullAddress,
                }, 60 * 60 * 24)
                console.log(`pending:${fullAddress}`)
                await typedRedis.del(`pending:${fullAddress}`)
                console.log("INSIDE DUMMY PIPELINE-DONE")
                return
            } catch (error) {
                console.log(error)
                return 
            }
        }

        try {
            console.log("INSIDE REAL PIPELINE")
            const { fullAddress, data, city, building, street } = job.data as AiEvaluetionQueueData

            const response = await getAiResponse(data)
            console.log(response)

            await resultsQueue.add(fullAddress, {fullAddress, ...response})
            const newAddressInfo = new AddressInfo({
                ...response,
                city,
                building,
                street,
                fullAddress,
            })
            await typedRedis.set(`cache:${fullAddress}`, {
                ...response,
                city,
                building,
                street,
                fullAddress,
            }, 60 * 60 * 24)
            await newAddressInfo.save()
            await typedRedis.del(`pending:${fullAddress}`)
            return
        } catch (error) {
            console.error('Job failed:', error)
            throw error
        }
    },
    { connection: redisClient, autorun: false }
)

export default worker


async function getAiResponse(data: Record<string, string>[][]) {

    if(data.length === 0) {
        console.log('EMPTY DATA')
        return {
            message: 'There is no sign that building will be demolished', 
            mark: 0
        }
    }

    const DemolitionSummary = z.object({
        message: z.string().max(100),
        mark: z.number().int().gte(0).lte(2),
    })
    console.log('AI STARTS')
    const response = await client.responses.parse({
        model: 'gpt-4o-2024-08-06',
        input: [
            {
                role: 'system',
                content:
                    'You are a real estate agent. Your goal is to assess the likelihood that a building will be demolished within the next three years, based on the data provided. Use the following scale: 0 – very unlikely, 1 – moderate chance, 2 – high probability.',
            },
            {
                role: 'user',
                content: JSON.stringify(data),
            },
        ],
        text: {
            format: zodTextFormat(
                DemolitionSummary,
                'demolition_prediction'
            ),
        },
    })
    console.log('AI DONE')

    if(!response.output_parsed) {
        throw new Error('problems with ai evaluetion')
    }

    return response.output_parsed
}
