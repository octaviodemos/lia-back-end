import { Router } from 'express';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockRepository } from './stock.repository';
import { BookRepository } from '@/modules/books/book.repository';
import { ensureAuthenticated } from '@/core/middleware/ensureAuthenticated';
import { ensureAdmin } from '@/core/middleware/ensureAdmin';

const stockRoutes = Router();

const stockRepository = new StockRepository();
const bookRepository = new BookRepository();
const service = new StockService(stockRepository, bookRepository);
const controller = new StockController(service);

stockRoutes.post(
  '/',
  ensureAuthenticated,
  ensureAdmin,
  (req, res) => controller.create(req, res),
);

export { stockRoutes };