import { Request, Response } from 'express';
import { StockService } from './stock.service';
import { createStockItemSchema } from './stock.schemas';

export class StockController {
  constructor(private service: StockService) {}

  async create(req: Request, res: Response) {
    try {
      const { body } = createStockItemSchema.parse(req);
      const stockItem = await this.service.create(body);
      return res.status(201).json(stockItem);
    } catch (error: any) {
      if (error.message.includes('Livro não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(400).json({ message: 'Erro ao adicionar item ao estoque', details: error.errors });
    }
  }
}