import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class StockRepository {
  constructor(private prisma: PrismaService) {}
  async create(data: Prisma.EstoqueCreateInput) {
    return this.prisma.estoque.create({ data });
  }

  async findById(id_estoque: number) {
    return this.prisma.estoque.findUnique({
      where: { id_estoque },
    });
  }

  /**
   * Encontra todos os itens de estoque para um livro específico.
   * Muito útil para a página de detalhes de um livro, para mostrar as diferentes
   * condições (novo/usado) e preços disponíveis.
   */
  async findByBookId(id_livro: number) {
    return this.prisma.estoque.findMany({
      where: { id_livro },
    });
  }

  async update(id_estoque: number, data: Prisma.EstoqueUpdateInput) {
    return this.prisma.estoque.update({
      where: { id_estoque },
      data,
    });
  }

  async delete(id_estoque: number) {
    return this.prisma.estoque.delete({
      where: { id_estoque },
    });
  }
}