import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookRepository } from '@/modules/books/book.repository';
import { StockRepository } from './stock.repository';
import { DecimalHelper } from '@/shared/utils/decimal.helper';
import { Prisma } from '@prisma/client';

interface ICreateStockItem {
  id_livro: number;
  preco: string;
  condicao?: string;
}

@Injectable()
export class StockService {
  constructor(
    private stockRepository: StockRepository,
    private bookRepository: BookRepository,
  ) {}

  async create({ id_livro, preco, condicao }: ICreateStockItem) {
    if (id_livro == null || Number.isNaN(Number(id_livro))) {
      throw new BadRequestException('Parâmetro id_livro inválido ou ausente.');
    }

    const book = await this.bookRepository.findById(Number(id_livro));
    if (!book) {
      throw new NotFoundException('Livro não encontrado com o ID fornecido.');
    }

    const stockItem = await this.stockRepository.create({
      preco,
      condicao,
      livro: {
        connect: {
          id_livro: book.id_livro,
        },
      },
    });

    return {
      ...stockItem,
      preco: DecimalHelper.toString(stockItem.preco),
    };
  }

  async update(id_estoque: number, data: Prisma.EstoqueUpdateInput) {
    const stockItemExists = await this.stockRepository.findById(id_estoque);
    if (!stockItemExists) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }

    const updatedItem = await this.stockRepository.update(id_estoque, data);
    return {
      ...updatedItem,
      preco: DecimalHelper.toString(updatedItem.preco),
    };
  }
}
