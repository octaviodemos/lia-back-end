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
      },
    });
  }

  async findApprovedComments(id_publicacao: number) {
    // Schema does not have approval flag; return comments for the publication (visible by default)
    return this.prisma.publicacaoComentario.findMany({
      where: { id_publicacao },
      orderBy: { data_comentario: 'desc' },
      include: { usuario: { select: { id_usuario: true, nome: true } } },
    });
  }

  async findPendingComments() {
    // Without approval flag, return recent comments for admin moderation
    return this.prisma.publicacaoComentario.findMany({
      include: { usuario: { select: { id_usuario: true, nome: true } }, publicacao: { select: { id_publicacao: true, titulo: true } } },
      orderBy: { data_comentario: 'desc' },
      take: 50,
    });
  }

  async updateCommentApproval(id_comentario: number) {
    // No-op compatibility: return the comment as-is (approval is handled by deletion in this strategy)
    return this.prisma.publicacaoComentario.findUnique({ where: { id_comentario } });
  }

  async deleteComment(id_comentario: number) {
    return this.prisma.publicacaoComentario.delete({ where: { id_comentario } });
  }
}
