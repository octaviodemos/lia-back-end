import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class BookRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.LivroCreateInput) {
    return this.prisma.livro.create({ data });
  }

  async findByIsbn(isbn: string) {
    return this.prisma.livro.findUnique({
      where: { isbn },
    });
  }

  async findAll() {
    return this.prisma.livro.findMany();
  }

  async findById(id_livro: number) {
    return this.prisma.livro.findUnique({
      where: { id_livro },
    });
  }
}