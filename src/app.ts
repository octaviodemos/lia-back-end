import 'dotenv/config';
import express from 'express';
import passport from 'passport';
import cors from 'cors'; 

import { userRoutes } from '@/modules/users/user.routes';
import { authRoutes } from '@/modules/auth/auth.routes';
import { bookRoutes } from '@/modules/books/book.routes';
import { stockRoutes } from '@/modules/stock/stock.routes';
import { cartRoutes } from '@/modules/cart/cart.routes';

const app = express();

const allowedOrigins = ['http://localhost:4200'];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Acesso não permitido pelo CORS'));
    }
  },
};

app.use(cors(corsOptions));


app.use(express.json());
app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'API do Projeto LIA está no ar!' });
});

// Rotas da API
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/cart', cartRoutes);

export { app };