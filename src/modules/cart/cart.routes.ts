import { Router } from 'express';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { StockRepository } from '@/modules/stock/stock.repository'; 
import { ensureAuthenticated } from '@/core/middleware/ensureAuthenticated';

const cartRoutes = Router();

const cartRepository = new CartRepository();
const stockRepository = new StockRepository();
const service = new CartService(cartRepository, stockRepository);
const controller = new CartController(service);

cartRoutes.post(
  '/items',
  ensureAuthenticated,
  (req, res) => controller.addItem(req, res),
);

cartRoutes.get(
  '/',
  ensureAuthenticated,
  (req, res) => controller.getCart(req, res),
);

export { cartRoutes };