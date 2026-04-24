import { Injectable } from '@nestjs/common';
import { Prisma, TipoImagem } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class BookRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.LivroCreateInput) {
    return this.prisma.livro.create({
      data,
      include: { imagens: true },
    });
  }

  async createEstoqueInicial(id_livro: number, preco: string) {
    return this.prisma.estoque.create({
      data: {
        id_livro,
        preco,
        disponivel: true,
        condicao: null,
      },
    });
  }

  async upsertImagemByTipo(id_livro: number, tipo_imagem: TipoImagem, url_imagem: string) {
    const ex = await this.prisma.imagemLivro.findFirst({ where: { id_livro, tipo_imagem } });
    if (ex) {
      return this.prisma.imagemLivro.update({
        where: { id_imagem_livro: ex.id_imagem_livro },
        data: { url_imagem },
      });
    }
    return this.prisma.imagemLivro.create({ data: { id_livro, tipo_imagem, url_imagem } });
  }

  async findByIsbn(isbn: string) {
    return this.prisma.livro.findFirst({
      where: { isbn },
    });
  }

  async findOutrasOpcoesMesmoIsbn(id_livro_atual: number, isbn: string | null | undefined) {
    const isbnNorm = isbn?.trim();
    if (!isbnNorm) return [];
    return this.prisma.livro.findMany({
      where: {
        isbn: isbnNorm,
        id_livro: { not: id_livro_atual },
        estoque: { some: { disponivel: true } },
      },
      select: {
        id_livro: true,
        nota_conservacao: true,
        descricao_conservacao: true,
        imagens: true,
        estoque: {
          where: { disponivel: true },
          select: { id_estoque: true, preco: true, condicao: true, disponivel: true },
        },
      },
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
        nota_conservacao: true,
        descricao_conservacao: true,
        destaque_vitrine: true,
        imagens: true,
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
            disponivel: true,
            preco: true,
            condicao: true,
          },
        },
      },
    });
  }

  async update(id_livro: number, data: Prisma.LivroUpdateInput) {
    return this.prisma.livro.update({
      where: { id_livro },
      data,
      include: { imagens: true },
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
        nota_conservacao: true,
        descricao_conservacao: true,
        destaque_vitrine: true,
        imagens: true,
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
            disponivel: true,
            preco: true,
            condicao: true,
          },
        },
      },
    });
  }

  async buildWhereForApprovedReviewsForEdition(id_livro: number): Promise<Prisma.AvaliacaoWhereInput> {
    const livro = await this.prisma.livro.findUnique({
      where: { id_livro },
      select: { id_livro: true, isbn: true, titulo: true },
    });
    if (!livro) {
      return { id_livro: -1, aprovado: true };
    }
    const isbnNorm = livro.isbn?.trim() ?? '';
    if (isbnNorm !== '') {
      return { aprovado: true, livro: { is: { isbn: isbnNorm } } };
    }
    const tituloNorm = livro.titulo?.trim() ?? '';
    if (tituloNorm !== '') {
      return { aprovado: true, livro: { is: { titulo: tituloNorm } } };
    }
    return { aprovado: true, id_livro: livro.id_livro };
  }

  async aggregateApprovedRatingForEdition(id_livro: number): Promise<{ nota_media: number | null; total_avaliacoes: number }> {
    const where = await this.buildWhereForApprovedReviewsForEdition(id_livro);
    const agg = await this.prisma.avaliacao.aggregate({
      where,
      _avg: { nota: true },
      _count: { _all: true },
    });
    const raw = agg._avg.nota;
    const nota_media =
      raw == null || Number.isNaN(Number(raw)) ? null : Math.round(Number(raw) * 10) / 10;
    return { nota_media, total_avaliacoes: agg._count._all };
  }

  async findReviewsByBook(id_livro: number) {
    const where = await this.buildWhereForApprovedReviewsForEdition(id_livro);
    return this.prisma.avaliacao.findMany({
      where,
      orderBy: { data_avaliacao: 'desc' },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
      },
    });
  }

  async findApprovedReviewsWithReactions(id_livro: number, id_usuario?: number) {
    const where = await this.buildWhereForApprovedReviewsForEdition(id_livro);
    const reviews = await this.prisma.avaliacao.findMany({
      where,
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
    const where = await this.buildWhereForApprovedReviewsForEdition(id_livro);
    return this.prisma.avaliacao.findMany({
      where,
      orderBy: { data_avaliacao: 'desc' },
      include: { usuario: { select: { id_usuario: true, nome: true } } },
    });
  }

  async findPendingReviews() {
    return this.prisma.avaliacao.findMany({
      where: { aprovado: false },
      orderBy: { data_avaliacao: 'desc' },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
        livro: { select: { id_livro: true, titulo: true, imagens: true } },
      },
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