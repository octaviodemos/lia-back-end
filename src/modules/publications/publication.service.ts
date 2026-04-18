import { Injectable } from '@nestjs/common';
import { PublicationRepository } from './publication.repository';

@Injectable()
export class PublicationService {
  constructor(private repo: PublicationRepository) {}

  async createComment(id_publicacao: number, id_usuario: number, conteudo: string) {
    return this.repo.createComment(id_publicacao, id_usuario, conteudo);
  }

  async getApprovedComments(id_publicacao: number, id_usuario?: number) {
    return this.repo.findApprovedCommentsWithReactions(id_publicacao, id_usuario);
  }

  async getPendingComments() {
    return this.repo.findPendingComments();
  }

  async approveComment(id_comentario: number) {
    return this.repo.updateCommentApproval(id_comentario);
  }

  async rejectComment(id_comentario: number) {
    return this.repo.deleteComment(id_comentario);
  }

  async getReactions(id_publicacao: number, id_usuario?: number) {
    const counts = await this.repo.countReactions(id_publicacao);
    const result: any = { likes: counts.likes, dislikes: counts.dislikes };
    if (id_usuario) {
      const user = await this.repo.getUserReaction(id_publicacao, id_usuario);
      result.userReaction = user?.tipo ?? null;
    } else {
      result.userReaction = null;
    }
    return result;
  }

  async postReaction(id_publicacao: number, id_usuario: number, tipo: 'LIKE' | 'DISLIKE') {
    const existing = await this.repo.getUserReaction(id_publicacao, id_usuario);
    if (!existing) {
      await this.repo.createReaction(id_publicacao, id_usuario, tipo);
    } else if (existing.tipo === tipo) {
      await this.repo.deleteReaction(id_publicacao, id_usuario);
    } else {
      await this.repo.updateReaction(id_publicacao, id_usuario, tipo);
    }
    const counts = await this.repo.countReactions(id_publicacao);
    const user = await this.repo.getUserReaction(id_publicacao, id_usuario);
    return { userReaction: user?.tipo ?? null, likes: counts.likes, dislikes: counts.dislikes };
  }

  async deleteReaction(id_publicacao: number, id_usuario: number) {
    await this.repo.deleteReaction(id_publicacao, id_usuario);
    const counts = await this.repo.countReactions(id_publicacao);
    return { userReaction: null, likes: counts.likes, dislikes: counts.dislikes };
  }
}
