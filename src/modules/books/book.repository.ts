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
    return this.prisma.livro.findMany({
      select: {
        id_livro: true,
        titulo: true,
        sinopse: true,
        editora: true,
        ano_publicacao: true,
        isbn: true,
        capa_url: true,
        autores: {
          select: {
            autor: {
              select: {
                id_autor: true,
                nome_completo: true,
              },
            },
          },
        },
        generos: {
          select: {
            genero: {
              select: {
                id_genero: true,
                nome: true,
              },
            },
          },
        },
        estoque: {
          select: {
            id_estoque: true,
            id_livro: true,
            quantidade: true,
            preco: true,
            condicao: true,
          },
        },
      },
    });
  }

  async findById(id_livro: number) {
    return this.prisma.livro.findUnique({
      where: { id_livro },
      select: {
        id_livro: true,
        titulo: true,
        sinopse: true,
        editora: true,
        ano_publicacao: true,
        isbn: true,
        capa_url: true,
        autores: {
          select: {
            autor: {
              select: {
                id_autor: true,
                nome_completo: true,
              },
            },
          },
        },
        generos: {
          select: {
            genero: {
              select: {
                id_genero: true,
                nome: true,
              },
            },
          },
        },
        estoque: {
          select: {
            id_estoque: true,
            id_livro: true,
            quantidade: true,
            preco: true,
            condicao: true,
          },
        },
      },
    });
  }

  async findReviewsByBook(id_livro: number) {
    return this.prisma.avaliacao.findMany({
      where: { id_livro },
      orderBy: { data_avaliacao: 'desc' },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
      },
    });
  }

  async createReviewForBook(id_livro: number, id_usuario: number, data: Prisma.AvaliacaoCreateInput) {
    return this.prisma.avaliacao.create({
      data: {
        ...(data as any),
        id_livro,
        id_usuario,
      },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
      },
    });
  }
}