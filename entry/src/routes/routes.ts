import { Request, Response, Router } from 'express'
import { typedRedis, parsingQueue, resultsQueue } from '../configs/redis'
import AddressInfo from '../models/AddressInfo'
import { getMonthsAgo } from '../helpers/helpers'

const router = Router()

router.get('/', (req, res) => {
    res.json({ message: 'API is running 🚀' })
})
// router.post('/', myFunc)
router.post('/', async (req: Request, res: Response) : Promise<any> => {
    try {
        const { city, building, street, fullAddress } = req.body
        console.log(`pending:${fullAddress}`)
        
        //Checks if this address is processed right now
        const inProcess = await typedRedis.keyExists(`pending:${fullAddress}`)
        
        console.log(`inProcess?: ${inProcess}`)
        if (inProcess) {
            return res.json({ status: 'in_process' })
        }

        const addressCacheExists = await typedRedis.keyExists(`cache:${fullAddress}`)
        if (addressCacheExists) {
            console.log(`${fullAddress} EXISTS in redis`)

            await typedRedis.expire(`cache:${fullAddress}`, 60 * 60 * 24 * 10)
            const cache = await typedRedis.get(`cache:${fullAddress}`)
            
            if(!cache) {
                throw new Error(`couldnt find cache cache:${fullAddress}`)
            }
            
            await resultsQueue.add(fullAddress, cache)
            return res.json({ status: 'in_process' })
        }
        console.log(`${fullAddress} DONT EXISTS in redis`)

        const info = await AddressInfo.findOne({ fullAddress: fullAddress })
        const sixMonthAgo = getMonthsAgo(6)

        // if results in long term memory and younger than 6 month
        if (info && info.updatedAt < sixMonthAgo) {
            console.log(`${fullAddress} EXISTS in MONGO, and less than 6 month`)
            
            const { message, mark, city, street, building } = info
            // save in cache
            await typedRedis.set(
                `cache:${fullAddress}`,
                { message, mark, city, street, building, fullAddress},
                60 * 60 * 24 * 10
            )
            await resultsQueue.add(fullAddress, info)
            return res.json({ status: 'in_process' })
        } else if (info && info.updatedAt > sixMonthAgo) {
            // if results older 
            console.log(`${fullAddress} EXISTS in MONGO, and more than 6 month`)
            await AddressInfo.deleteOne({ fullAddress })
        }

        console.log(`${fullAddress} DONT EXIST in MONGO`)
        // setting flag to prevent evalueting the same address at the same time
        await typedRedis.set(`pending:${fullAddress}`, true, 5 * 60)
        // creating job in Crawler
        await parsingQueue.add(
            fullAddress,
            { city, building, street, fullAddress }
        )
        return res.json({ status: 'in_process' })
    } catch (error) {
        console.log(error)
		return res.status(500).json({ message: "Error starting process", error });
    }
    
})

export default router