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
      where: { id_livro, aprovado: true },
      orderBy: { data_avaliacao: 'desc' },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
      },
    });
  }

  async findApprovedReviewsWithReactions(id_livro: number, id_usuario?: number) {
    const reviews = await this.prisma.avaliacao.findMany({
      where: { id_livro, aprovado: true },
      orderBy: { data_avaliacao: 'desc' },
      include: { usuario: { select: { id_usuario: true, nome: true } } },
    });

    if (!reviews || reviews.length === 0) return [];

    const reviewIds = reviews.map((r: any) => r.id_avaliacao);

    const [likeCountsRaw, dislikeCountsRaw] = await Promise.all([
      this.prisma.avaliacaoReacao.groupBy({
        by: ['id_avaliacao'],
        where: { id_avaliacao: { in: reviewIds }, tipo: 'LIKE' },
        _count: { id_avaliacao: true },
      }),
      this.prisma.avaliacaoReacao.groupBy({
        by: ['id_avaliacao'],
        where: { id_avaliacao: { in: reviewIds }, tipo: 'DISLIKE' },
        _count: { id_avaliacao: true },
      }),
    ]);

    const likeMap: Record<number, number> = {};
    for (const r of likeCountsRaw) likeMap[r.id_avaliacao] = r._count.id_avaliacao;
    const dislikeMap: Record<number, number> = {};
    for (const r of dislikeCountsRaw) dislikeMap[r.id_avaliacao] = r._count.id_avaliacao;

    let userMap: Record<number, { tipo: 'LIKE' | 'DISLIKE' } | null> = {};
    if (id_usuario) {
      const userReacts = await this.prisma.avaliacaoReacao.findMany({ where: { id_avaliacao: { in: reviewIds }, id_usuario } });
      for (const ur of userReacts) userMap[ur.id_avaliacao] = { tipo: (ur.tipo as any) };
    }

    return reviews.map((r: any) => ({
      ...r,
      likes: likeMap[r.id_avaliacao] || 0,
      dislikes: dislikeMap[r.id_avaliacao] || 0,
      userReaction: userMap[r.id_avaliacao]?.tipo ?? null,
    }));
  }

  // Reactions for reviews
  async countReactionsForReview(id_avaliacao: number) {
    const [likes, dislikes] = await Promise.all([
      this.prisma.avaliacaoReacao.count({ where: { id_avaliacao, tipo: 'LIKE' } }),
      this.prisma.avaliacaoReacao.count({ where: { id_avaliacao, tipo: 'DISLIKE' } }),
    ]);
    return { likes, dislikes };
  }

  async getUserReactionForReview(id_avaliacao: number, id_usuario: number) {
    return this.prisma.avaliacaoReacao.findUnique({ where: { id_avaliacao_id_usuario: { id_avaliacao, id_usuario } } });
  }

  async createReactionForReview(id_avaliacao: number, id_usuario: number, tipo: 'LIKE' | 'DISLIKE') {
    try {
      return await this.prisma.avaliacaoReacao.create({ data: { id_avaliacao, id_usuario, tipo } });
    } catch (err: any) {
      if (err.code === 'P2002') return null;
      throw err;
    }
  }

  async updateReactionForReview(id_avaliacao: number, id_usuario: number, tipo: 'LIKE' | 'DISLIKE') {
    return this.prisma.avaliacaoReacao.update({ where: { id_avaliacao_id_usuario: { id_avaliacao, id_usuario } }, data: { tipo } });
  }

  async deleteReactionForReview(id_avaliacao: number, id_usuario: number) {
    try {
      return await this.prisma.avaliacaoReacao.delete({ where: { id_avaliacao_id_usuario: { id_avaliacao, id_usuario } } });
    } catch (err: any) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  async findApprovedReviewsByBook(id_livro: number) {
    return this.prisma.avaliacao.findMany({
      where: { id_livro, aprovado: true },
      orderBy: { data_avaliacao: 'desc' },
      include: { usuario: { select: { id_usuario: true, nome: true } } },
    });
  }

  async findPendingReviews() {
    return this.prisma.avaliacao.findMany({
      where: { aprovado: false },
      orderBy: { data_avaliacao: 'desc' },
      include: { usuario: { select: { id_usuario: true, nome: true } }, livro: { select: { id_livro: true, titulo: true } } },
      take: 50,
    });
  }

  async deleteReview(id_avaliacao: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.avaliacaoReacao.deleteMany({ where: { id_avaliacao } });
      return tx.avaliacao.delete({ where: { id_avaliacao } });
    });
  }

  async createReviewForBook(id_livro: number, id_usuario: number, data: Prisma.AvaliacaoCreateInput) {
    return this.prisma.avaliacao.create({
      data: {
        ...(data as any),
        id_livro,
        id_usuario,
        aprovado: false,
      },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
      },
    });
  }

  async approveReview(id_avaliacao: number) {
    return this.prisma.avaliacao.update({ where: { id_avaliacao }, data: { aprovado: true } });
  }


}