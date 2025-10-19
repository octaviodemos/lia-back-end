import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class StockRepository {
  async create(data: Prisma.EstoqueCreateInput) {
    return prisma.estoque.create({ data });
  }

  async findById(id_estoque: number) {
    return prisma.estoque.findUnique({
      where: { id_estoque },
    });
  }

  /**
   * Encontra todos os itens de estoque para um livro específico.
   * Muito útil para a página de detalhes de um livro, para mostrar as diferentes
   * condições (novo/usado) e preços disponíveis.
   */
  async findByBookId(id_livro: number) {
    return prisma.estoque.findMany({
      where: { id_livro },
    });
  }

  async update(id_estoque: number, data: Prisma.EstoqueUpdateInput) {
    return prisma.estoque.update({
      where: { id_estoque },
      data,
    });
  }

  async delete(id_estoque: number) {
    return prisma.estoque.delete({
      where: { id_estoque },
    });
  }
}