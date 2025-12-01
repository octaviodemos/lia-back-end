import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { StockRepository } from '@/modules/stock/stock.repository';
import { DecimalHelper } from '@/shared/utils/decimal.helper';

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
        total: '0.00',
      };
    }

    // Converte preços para strings, inclui dados do livro completos e calcula total
    const itensFormatted = cart.itens.map(item => {
      // Formatar autores
      const autores = item.estoque.livro.autores?.map(la => ({
        id_autor: la.autor.id_autor,
        nome_completo: la.autor.nome_completo,
      })) || [];

      // Formatar gêneros
      const generos = item.estoque.livro.generos?.map(lg => ({
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
      return acc + item.quantidade * DecimalHelper.toNumber(item.estoque.preco);
    }, 0);

    return { 
      ...cart, 
      itens: itensFormatted,
      total: total.toFixed(2) 
    };
  }

  async removeItem(_id_usuario: number, id_carrinho_item: number) {
    // TODO: Adicionar validação para garantir que o item pertence ao usuário
    // Por enquanto, deletamos diretamente por ID
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