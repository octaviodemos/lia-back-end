import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { StockRepository } from '@/modules/stock/stock.repository';
import { DecimalHelper } from '@/shared/utils/decimal.helper';

interface IAddItem {
  id_usuario: number;
  id_estoque: number;
}

@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository, private stockRepository: StockRepository) {}

  async addItem({ id_usuario, id_estoque }: IAddItem) {
    const stockItem = await this.stockRepository.findById(id_estoque);
    if (!stockItem) throw new NotFoundException('Item de estoque não encontrado.');
    if (stockItem.disponivel === false) {
      throw new BadRequestException('Este exemplar não está mais disponível.');
    }

    const cart = await this.cartRepository.findOrCreateByUserId(id_usuario);
    const existingItem = await this.cartRepository.findItemInCart(cart.id_carrinho, id_estoque);

    if (existingItem) {
      return {
        added: false,
        message: 'Item já está no carrinho.',
        id_carrinho_item: existingItem.id_carrinho_item,
      };
    }

    const created = await this.cartRepository.addItem(cart.id_carrinho, id_estoque);
    return { added: true, id_carrinho_item: created.id_carrinho_item };
  }

  async getCart(id_usuario: number) {
    const cart = await this.cartRepository.findCartWithDetailsByUserId(id_usuario);

    if (!cart) {
      return {
        id_carrinho: null,
        id_usuario,
        itens: [],
        total: '0.00',
      };
    }

    const itensFormatted = cart.itens.map((item) => {
      const autores =
        item.estoque.livro.autores?.map((la) => ({
          id_autor: la.autor.id_autor,
          nome_completo: la.autor.nome_completo,
        })) || [];

      const generos =
        item.estoque.livro.generos?.map((lg) => ({
          id_genero: lg.genero.id_genero,
          nome: lg.genero.nome,
        })) || [];

      return {
        ...item,
        estoque: {
          ...item.estoque,
          preco: DecimalHelper.toString(item.estoque.preco),
          livro: {
            ...item.estoque.livro,
            autores,
            generos,
          },
        },
      };
    });

    const total = cart.itens.reduce((acc, item) => {
      return acc + DecimalHelper.toNumber(item.estoque.preco);
    }, 0);

    return {
      ...cart,
      itens: itensFormatted,
      total: total.toFixed(2),
    };
  }

  async removeItem(_id_usuario: number, id_carrinho_item: number) {
    try {
      await this.cartRepository.removeItem(id_carrinho_item);
      return { message: 'Item removido do carrinho com sucesso' };
    } catch (error) {
      throw new NotFoundException('Item não encontrado no carrinho');
    }
  }

  async clearCart(id_usuario: number) {
    const cart = await this.cartRepository.findOrCreateByUserId(id_usuario);
    return this.cartRepository.removeAllItems(cart.id_carrinho);
  }
}
