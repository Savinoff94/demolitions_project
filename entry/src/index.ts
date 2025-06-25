import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();
import { mongoClient } from './configs/mongo';
import router from './routes/routes';


const app = express();
const port = process.env.ENTRY_PORT || 3000;
mongoClient()

app.use(cors({
  origin: `${process.env.CORS_ORIGIN}`
}));

// Middleware
app.use(express.json());
app.use('/api', router)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});