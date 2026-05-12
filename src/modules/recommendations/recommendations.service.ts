import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BookService } from '../books/book.service';
import { AiService } from '../ai/ai.service';
import { SkoobService } from './skoob.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skoob: SkoobService,
    private readonly ai: AiService,
    private readonly books: BookService,
  ) {}

  async getSkoobRecommendationsForUser(idUsuario: number) {
    const user = await (this.prisma.usuario as any).findUnique({
      where: { id_usuario: idUsuario },
      select: { skoob_user_id: true },
    });
    const skoobId = (user?.skoob_user_id as string | null | undefined)?.trim();
    if (!skoobId) {
      return { livros: [] as unknown[] };
    }
    const bookshelf = await this.skoob.fetchUserBookshelf(skoobId);
    const ids = this.ai.recommendBooksMock(bookshelf);
    if (!ids.length) {
      return { livros: [] as unknown[] };
    }
    const catalogo = await this.books.findAll();
    const porId = new Map((catalogo as any[]).map((l) => [l.id_livro, l]));
    const livros = ids.map((id) => porId.get(id)).filter(Boolean);
    return { livros };
  }
}
