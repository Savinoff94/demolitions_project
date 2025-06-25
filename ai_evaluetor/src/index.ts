import { mongoClient } from "./configs/mongo"
import worker from "./workers/demolitionEvaluetor"
async function start() {
  try {
    await mongoClient()
    console.log('MongoDB connected')
    worker.run()
  } catch (err) {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  }
}
  
start()