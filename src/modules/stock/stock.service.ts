import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookRepository } from '@/modules/books/book.repository';
import { StockRepository } from './stock.repository';
import { DecimalHelper } from '@/shared/utils/decimal.helper';
import { Prisma } from '@prisma/client';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';

interface ICreateStockItem {
  id_livro: number;
  preco: string;
  condicao?: string;
  nota_conservacao: number;
}

@Injectable()
export class StockService {
  constructor(
    private stockRepository: StockRepository,
    private bookRepository: BookRepository,
  ) {}

  async create({ id_livro, preco, condicao, nota_conservacao }: ICreateStockItem) {
    if (id_livro == null || Number.isNaN(Number(id_livro))) {
      throw new BadRequestException('Parâmetro id_livro inválido ou ausente.');
    }

    const book = await this.bookRepository.findById(Number(id_livro));
    if (!book) {
      throw new NotFoundException('Livro não encontrado com o ID fornecido.');
    }

    await this.bookRepository.update(Number(book.id_livro), {
      nota_conservacao,
    });

    const stockItem = await this.stockRepository.create({
      preco,
      condicao: condicao ?? null,
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

  async list() {
    const items = await this.stockRepository.findAll();
    return items.map((i) => ({
      ...i,
      preco: DecimalHelper.toString(i.preco),
    }));
  }

  async updateItem(id_estoque: number, dto: UpdateStockItemDto) {
    const row = await this.stockRepository.findById(id_estoque);
    if (!row) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }

    if (dto.nota_conservacao != null) {
      await this.bookRepository.update(row.id_livro, {
        nota_conservacao: dto.nota_conservacao,
      });
    }

    const data: Prisma.EstoqueUpdateInput = {};
    if (dto.preco !== undefined) {
      data.preco = dto.preco;
    }
    if (dto.disponivel !== undefined) {
      data.disponivel = dto.disponivel;
    }

    if (Object.keys(data).length > 0) {
      await this.stockRepository.update(id_estoque, data);
    }

    const out = await this.stockRepository.findByIdWithLivro(id_estoque);
    if (!out) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }
    return {
      ...out,
      preco: DecimalHelper.toString((out as any).preco),
    };
  }

  async remove(id_estoque: number) {
    const row = await this.stockRepository.findById(id_estoque);
    if (!row) {
      throw new NotFoundException('Item de estoque não encontrado.');
    }
    try {
      await this.stockRepository.delete(id_estoque);
    } catch (e: any) {
      const msg = e?.message || 'Não foi possível excluir o item (pode estar vinculado a pedido ou carrinho).';
      throw new BadRequestException(msg);
    }
    return { id_estoque, removido: true };
  }
}
