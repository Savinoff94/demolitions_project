import dotenv from 'dotenv'
dotenv.config()
import { Worker } from 'bullmq'
import puppeteer from 'puppeteer'
import Crawler from '../controllers/Crawler/Crawler'
import { aiEvaluationQueue, redisClient } from '../configs/redis'
import { ParsingQueueData } from '../types/types'

const worker = new Worker(
    'parsingQueue',
    async (job) => {
        console.log('INSIDE SCRAPING WORKER')

        let { city, building, street, fullAddress } = job.data as ParsingQueueData

        console.log('data city:', city)
        console.log('data building:', building)
        console.log('data street:', street)
        console.log('data fullAddress:', fullAddress)
        
        try {
            if (process.env.IS_DUMMY_DATA === 'true') {
                console.log('INSIDE DUMYY PIPELINE')
                await aiEvaluationQueue.add(
                    fullAddress,
                    {
                        fullAddress,
                        city,
                        building,
                        street,
                        data: [],
                    }
                )
                console.log('INSIDE DUMYY PIPELINE: data to ai is sent')
                return 
            }
        } catch (error) {
            console.log(error)
        }

        let browser = null;
        try {
            browser = await puppeteer.launch({ 
                headless: true,
                executablePath: require('puppeteer').executablePath(),
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            })  
        } catch (error) {
            console.log(error)
        }
        

        try {
            console.log('INSIDE REAL PIPELINE')

            if(browser === null) {
                throw new Error('error opening browser')
            }
            const page = await browser.newPage()

            const crawler = new Crawler(browser, page)

            await crawler.goToWebsite(
                'https://handasa.ramat-gan.muni.il/iturbakashot/?search_radio=C_RequestByAddressGRP'
            )
            console.log("ON WEBSITE")

            const html = await page.content();
            console.log(html);

            await crawler.moveToAddressInfo(street, building)
            // checks if there is no data about this address, or such address does not exist
            try {
                await page.waitForSelector('table', {
                    visible: true,
                    timeout: 10000,
                })
            } catch (error) {
                const errorEl = await page.$('.hidden-error');
                if(errorEl) {
                    throw new Error('wrong address')
                }
                else {
                    // if there is no data, proceed to evaluetion worker
                    await aiEvaluationQueue.add(fullAddress, {
                        fullAddress,
                        data: [],
                        city,
                        building,
                        street,
                    })
                    console.log("NO TABLE")
                }
                return
            }
            
            console.log("ON ADDRESS")

            const linksElementsToDocs = await crawler.getLinksElementsToDocs()
            if (linksElementsToDocs.length === 0) {
                console.log('NO_DOCUMENTS AFTER 2020')
            }
            console.log("GOT LINKS")

            const data = []
            for (const numberLink of linksElementsToDocs) {
                await crawler.goToNumberLink(Number(numberLink))
                const pageTablesData = await crawler.parseTables()
                data.push(pageTablesData)
                await crawler.goBack()
            }

            const info = {
                fullAddress,
                data,
                city,
                building,
                street,
            }
            console.log('info', info)

            await aiEvaluationQueue.add(fullAddress, info)
        } catch (error) {
            console.error('Job failed:', error)
            throw error
        } finally {
            if(browser) {
                await browser.close()
            }
        }
    },
    { connection: redisClient }
)

export default worker

worker.on('error', (err) => console.error('Worker error:', err))
