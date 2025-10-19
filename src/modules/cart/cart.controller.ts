import { Request, Response } from 'express';
import { CartService } from './cart.service';
import { addItemToCartSchema } from './cart.schemas';
import { Usuario } from '@prisma/client';

export class CartController {
  constructor(private service: CartService) {}

  async addItem(req: Request, res: Response) {
    try {
      const { body } = addItemToCartSchema.parse(req);
      const user = req.user as Usuario;

      const cartItem = await this.service.addItem({
        id_usuario: user.id_usuario,
        id_estoque: body.id_estoque,
        quantidade: body.quantidade,
      });

      return res.status(200).json(cartItem);
    } catch (error: any) {
      return res.status(400).json({ message: error.message, details: error.errors });
    }
  }

  async getCart(req: Request, res: Response) {
    try {
      const user = req.user as Usuario;
      const cartDetails = await this.service.getCart(user.id_usuario);
      return res.status(200).json(cartDetails);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar o carrinho.' });
    }
  }
}