import { BookRepository } from '@/modules/books/book.repository';
import { StockRepository } from './stock.repository';
import { Prisma } from '@prisma/client';

interface ICreateStockItem {
  id_livro: number;
  quantidade: number;
  preco: number;
  condicao?: string;
}

export class StockService {
  constructor(
    private stockRepository: StockRepository,
    private bookRepository: BookRepository,
  ) {}

  async create({ id_livro, quantidade, preco, condicao }: ICreateStockItem) {
    const book = await this.bookRepository.findById(id_livro);
    if (!book) {
      throw new Error('Livro não encontrado com o ID fornecido.');
    }
    
    const stockItem = await this.stockRepository.create({
      quantidade,
      preco,
      condicao,
      livro: {
        connect: {
          id_livro: book.id_livro,
        },
      },
    });


    return stockItem;
  }

  async update(id_estoque: number, data: Prisma.EstoqueUpdateInput) {
    const stockItemExists = await this.stockRepository.findById(id_estoque);
    if (!stockItemExists) {
      throw new Error('Item de estoque não encontrado.');
    }

    return this.stockRepository.update(id_estoque, data);
  }

}