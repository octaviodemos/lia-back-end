import 'dotenv/config';
import express from 'express';
import { userRoutes } from '@/modules/users/user.routes'; 
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API do Projeto LIA está no ar!' });
});

app.use('/api', userRoutes);

export { app }; 