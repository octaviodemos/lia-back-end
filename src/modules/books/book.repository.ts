import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class BookRepository {
  async create(data: Prisma.LivroCreateInput) {
    return prisma.livro.create({ data });
  }

  async findByIsbn(isbn: string) {
    return prisma.livro.findUnique({
      where: { isbn },
    });
  }

  async findAll() {
    return prisma.livro.findMany();
  }

  async findById(id_livro: number) {
    return prisma.livro.findUnique({
      where: { id_livro },
    });
  }
}