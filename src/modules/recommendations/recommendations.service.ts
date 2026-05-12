import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BookService } from '../books/book.service';
import { AiService } from '../ai/ai.service';
import { SkoobService } from './skoob.service';
import type { CatalogItemForRecommendation } from '../ai/ai.types';

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
    const catalogo = await this.books.findAll();
    const catalogResumido: CatalogItemForRecommendation[] = (catalogo as any[]).map((l) => ({
      id: l.id_livro,
      titulo: String(l.titulo ?? ''),
      autor: this.joinAutores(l),
      genero: this.joinGeneros(l),
    }));
    const ids = await this.ai.recommendBooks(bookshelf, catalogResumido);
    if (!ids.length) {
      return { livros: [] as unknown[] };
    }
    const porId = new Map((catalogo as any[]).map((livro) => [livro.id_livro, livro]));
    const livros = ids.map((id) => porId.get(id)).filter(Boolean);
    return { livros };
  }

  private joinAutores(l: any): string {
    const arr = l?.autores;
    if (!Array.isArray(arr) || !arr.length) {
      return '—';
    }
    const nomes = arr
      .map((a: any) => a?.nome_completo || a?.autor?.nome_completo || '')
      .map((s: string) => String(s).trim())
      .filter(Boolean);
    return nomes.length ? nomes.join(', ') : '—';
  }

  private joinGeneros(l: any): string {
    const arr = l?.generos;
    if (!Array.isArray(arr) || !arr.length) {
      return '—';
    }
    const nomes = arr
      .map((g: any) => g?.nome || g?.genero?.nome || '')
      .map((s: string) => String(s).trim())
      .filter(Boolean);
    return nomes.length ? nomes.join(', ') : '—';
  }
}
