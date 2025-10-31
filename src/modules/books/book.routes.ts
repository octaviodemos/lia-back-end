import { Router } from 'express';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { BookRepository } from './book.repository';
import { ensureAuthenticated } from '@/core/middleware/ensureAuthenticated';
import { ensureAdmin } from '@/core/middleware/ensureAdmin';

const bookRoutes = Router();

const repository = new BookRepository();
const service = new BookService(repository);
const controller = new BookController(service);

bookRoutes.get('/', (req, res) => controller.findAll(req, res));

bookRoutes.get('/:id', (req, res) => controller.findById(req, res));

// Rota protegida para administradores criarem um novo livro
bookRoutes.post(
  '/',
  ensureAuthenticated, 
  ensureAdmin,         
  (req, res) => controller.create(req, res),
);

export { bookRoutes };