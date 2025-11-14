import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { StockRepository } from '@/modules/stock/stock.repository';

interface IAddItem {
  id_usuario: number;
  id_estoque: number;
  quantidade: number;
}

@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository, private stockRepository: StockRepository) {}

  async addItem({ id_usuario, id_estoque, quantidade }: IAddItem) {
  const stockItem = await this.stockRepository.findById(id_estoque);
    if (!stockItem) throw new NotFoundException('Item de estoque não encontrado.');
    if (stockItem.quantidade < quantidade) throw new BadRequestException('Quantidade solicitada indisponível no estoque.');

    const cart = await this.cartRepository.findOrCreateByUserId(id_usuario);
    const existingItem = await this.cartRepository.findItemInCart(cart.id_carrinho, id_estoque);

    if (existingItem) {
      const novaQuantidade = existingItem.quantidade + quantidade;
      if (stockItem.quantidade < novaQuantidade) {
        throw new BadRequestException('Quantidade total solicitada excede o estoque disponível.');
      }
      return this.cartRepository.updateItemQuantity(existingItem.id_carrinho_item, novaQuantidade);
    }

    return this.cartRepository.addItem(cart.id_carrinho, id_estoque, quantidade);
  }

  async getCart(id_usuario: number) {
    const cart = await this.cartRepository.findCartWithDetailsByUserId(id_usuario);

    if (!cart) {
      return {
        id_carrinho: null,
        id_usuario,
        itens: [],
        total: 0,
      };
    }

    const total = cart.itens.reduce((acc, item) => {
      return acc + item.quantidade * Number(item.estoque.preco);
    }, 0);

    return { ...cart, total: total.toFixed(2) };
  }
}