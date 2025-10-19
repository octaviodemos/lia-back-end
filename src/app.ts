import 'dotenv/config';
import express from 'express';
import passport from 'passport';
import { userRoutes } from '@/modules/users/user.routes';
import { authRoutes } from '@/modules/auth/auth.routes';
import { bookRoutes } from '@/modules/books/book.routes';

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'API do Projeto LIA está no ar!' });
});

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

export { app };