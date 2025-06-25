import mongoose from 'mongoose'

export const mongoClient = async () => {
  if(!process.env.MONGO) {
    throw new Error("Missing MONGO environment variable.")
  }

  try {
    await mongoose.connect(process.env.MONGO)
    console.log('MongoDB connected')
  } catch (err) {
    if (err instanceof Error) {
      console.error('MongoDB connection failed:', err.message);
    } else {
      console.error('MongoDB connection failed:', err);
    }
    process.exit(1)
  }
}