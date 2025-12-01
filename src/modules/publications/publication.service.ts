import { Injectable } from '@nestjs/common';
import { PublicationRepository } from './publication.repository';

@Injectable()
export class PublicationService {
  constructor(private repo: PublicationRepository) {}

  async createComment(id_publicacao: number, id_usuario: number, conteudo: string) {
    return this.repo.createComment(id_publicacao, id_usuario, conteudo);
  }

  async getApprovedComments(id_publicacao: number) {
    return this.repo.findApprovedComments(id_publicacao);
  }

  async getPendingComments() {
    return this.repo.findPendingComments();
  }

  async approveComment(id_comentario: number) {
    // No-op: comments are visible by default; approving is a no-op in this strategy
    return this.repo.updateCommentApproval(id_comentario);
  }

  async rejectComment(id_comentario: number) {
    return this.repo.deleteComment(id_comentario);
  }
}
