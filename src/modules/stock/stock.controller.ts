import { Request, Response } from 'express';
import { StockService } from './stock.service';
import { createStockItemSchema, updateStockItemSchema } from './stock.schemas';

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

  async update(req: Request, res: Response) {
    try {
      const { body } = updateStockItemSchema.parse(req);
      const id = parseInt(req.params.id, 10);

      const updatedItem = await this.service.update(id, body);

      return res.status(200).json(updatedItem);
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message }); 
      }
      return res.status(400).json({ message: 'Erro ao atualizar item no estoque', details: error.errors });
    }
  }
}