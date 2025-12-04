import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PublicationRepository {
  constructor(private prisma: PrismaService) {}

  async createComment(id_publicacao: number, id_usuario: number, conteudo: string) {
    return this.prisma.publicacaoComentario.create({
      data: {
        id_publicacao,
        id_usuario,
        conteudo,
        aprovado: false,
      },
    });
  }

  async findApprovedComments(id_publicacao: number) {
    return this.prisma.publicacaoComentario.findMany({
      where: { id_publicacao, aprovado: true },
      orderBy: { data_comentario: 'desc' },
      include: { usuario: { select: { id_usuario: true, nome: true } } },
    });
  }

  async findApprovedCommentsWithReactions(id_publicacao: number, id_usuario?: number) {
    const comments = await this.prisma.publicacaoComentario.findMany({
      where: { id_publicacao, aprovado: true },
      orderBy: { data_comentario: 'desc' },
      include: { usuario: { select: { id_usuario: true, nome: true } } },
    });

    if (comments.length === 0) return [];

    const commentIds = comments.map((c: any) => c.id_comentario);

    const [likeCountsRaw, dislikeCountsRaw] = await Promise.all([
      this.prisma.publicacaoCurtida.groupBy({
        by: ['id_publicacao'],
        where: { id_publicacao: { in: commentIds }, tipo: 'LIKE' },
        _count: { id_publicacao: true },
      }),
      this.prisma.publicacaoCurtida.groupBy({
        by: ['id_publicacao'],
        where: { id_publicacao: { in: commentIds }, tipo: 'DISLIKE' },
        _count: { id_publicacao: true },
      }),
    ]);

    const likeMap: Record<number, number> = {};
    for (const r of likeCountsRaw) likeMap[r.id_publicacao] = r._count.id_publicacao;
    const dislikeMap: Record<number, number> = {};
    for (const r of dislikeCountsRaw) dislikeMap[r.id_publicacao] = r._count.id_publicacao;

    let userMap: Record<number, { tipo: 'LIKE' | 'DISLIKE' } | null> = {};
    if (id_usuario) {
      const userReacts = await this.prisma.publicacaoCurtida.findMany({ where: { id_publicacao: { in: commentIds }, id_usuario } });
      for (const ur of userReacts) userMap[ur.id_publicacao] = { tipo: (ur.tipo as any) };
    }

    return comments.map((c: any) => ({
      ...c,
      likes: likeMap[c.id_comentario] || 0,
      dislikes: dislikeMap[c.id_comentario] || 0,
      userReaction: userMap[c.id_comentario]?.tipo ?? null,
    }));
  }

  async findPendingComments() {
    return this.prisma.publicacaoComentario.findMany({
      where: { aprovado: false },
      include: { usuario: { select: { id_usuario: true, nome: true } }, publicacao: { select: { id_publicacao: true, titulo: true } } },
      orderBy: { data_comentario: 'desc' },
      take: 50,
    });
  }

  async updateCommentApproval(id_comentario: number) {
    return this.prisma.publicacaoComentario.update({ where: { id_comentario }, data: { aprovado: true } });
  }

  async deleteComment(id_comentario: number) {
    return this.prisma.publicacaoComentario.delete({ where: { id_comentario } });
  }

  async countReactions(id_publicacao: number) {
    const [likes, dislikes] = await Promise.all([
      this.prisma.publicacaoCurtida.count({ where: { id_publicacao, tipo: 'LIKE' } }),
      this.prisma.publicacaoCurtida.count({ where: { id_publicacao, tipo: 'DISLIKE' } }),
    ]);
    return { likes, dislikes };
  }

  async getUserReaction(id_publicacao: number, id_usuario: number) {
    return this.prisma.publicacaoCurtida.findUnique({ where: { id_publicacao_id_usuario: { id_publicacao, id_usuario } } });
  }

  async createReaction(id_publicacao: number, id_usuario: number, tipo: 'LIKE' | 'DISLIKE') {
    try {
      return await this.prisma.publicacaoCurtida.create({ data: { id_publicacao, id_usuario, tipo } });
    } catch (err: any) {
      if (err.code === 'P2002') return null;
      throw err;
    }
  }

  async updateReaction(id_publicacao: number, id_usuario: number, tipo: 'LIKE' | 'DISLIKE') {
    return this.prisma.publicacaoCurtida.update({ where: { id_publicacao_id_usuario: { id_publicacao, id_usuario } }, data: { tipo } });
  }

  async deleteReaction(id_publicacao: number, id_usuario: number) {
    try {
      return await this.prisma.publicacaoCurtida.delete({ where: { id_publicacao_id_usuario: { id_publicacao, id_usuario } } });
    } catch (err: any) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }
}
