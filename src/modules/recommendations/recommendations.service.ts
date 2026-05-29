import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BookService } from '../books/book.service';
import { AiService } from '../ai/ai.service';
import { SkoobService } from './skoob.service';
import type { CatalogItemForRecommendation } from '../ai/ai.types';
import { RECOMENDACOES_SKOOB_CACHE_TTL_MS } from './recommendations-cache.constants';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

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

    const emCache = await this.buscarRecomendacoesEmCache(idUsuario, skoobId);
    if (emCache) {
      return { livros: emCache };
    }

    const bookshelf = await this.skoob.fetchUserBookshelf(skoobId);
    const catalogo = await this.books.findAll();
    const catalogResumido: CatalogItemForRecommendation[] = (catalogo as any[])
      .filter((l) => l?.id_livro != null && String(l?.titulo ?? '').trim().length > 0)
      .map((l) => ({
        id: l.id_livro,
        titulo: String(l.titulo ?? '').trim(),
        autor: this.joinAutores(l),
        genero: this.joinGeneros(l),
      }));
    const ids = await this.ai.recommendBooks(bookshelf, catalogResumido);
    if (!ids.length) {
      return { livros: [] as unknown[] };
    }

    await this.salvarRecomendacoesEmCache(idUsuario, skoobId, ids);

    const porId = new Map((catalogo as any[]).map((livro) => [livro.id_livro, livro]));
    const livros = ids.map((id) => porId.get(id)).filter(Boolean);
    return { livros };
  }

  async invalidarCacheSkoob(idUsuario: number): Promise<void> {
    try {
      await (this.prisma as any).recomendacaoSkoobCache.deleteMany({
        where: { id_usuario: idUsuario },
      });
    } catch (err) {
      this.logger.warn(
        `Falha ao invalidar cache Skoob do usuário ${idUsuario}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async buscarRecomendacoesEmCache(
    idUsuario: number,
    skoobId: string,
  ): Promise<unknown[] | null> {
    const registro = await (this.prisma as any).recomendacaoSkoobCache.findUnique({
      where: { id_usuario: idUsuario },
    });
    if (!registro) {
      return null;
    }
    if (registro.skoob_user_id !== skoobId) {
      return null;
    }
    if (registro.expires_at <= new Date()) {
      return null;
    }
    const ids = Array.isArray(registro.livro_ids)
      ? registro.livro_ids.filter((id: unknown) => typeof id === 'number' && Number.isFinite(id))
      : [];
    if (!ids.length) {
      return null;
    }

    const catalogo = await this.books.findAll();
    const livros = this.montarLivrosPorIds(catalogo as any[], ids);
    if (!livros.length) {
      return null;
    }
    return livros;
  }

  private async salvarRecomendacoesEmCache(
    idUsuario: number,
    skoobId: string,
    livroIds: number[],
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + RECOMENDACOES_SKOOB_CACHE_TTL_MS);
    await (this.prisma as any).recomendacaoSkoobCache.upsert({
      where: { id_usuario: idUsuario },
      create: {
        id_usuario: idUsuario,
        skoob_user_id: skoobId,
        livro_ids: livroIds,
        expires_at: expiresAt,
      },
      update: {
        skoob_user_id: skoobId,
        livro_ids: livroIds,
        expires_at: expiresAt,
      },
    });
  }

  private montarLivrosPorIds(catalogo: any[], ids: number[]): unknown[] {
    const porId = new Map(catalogo.map((livro) => [livro.id_livro, livro]));
    return ids.map((id) => porId.get(id)).filter(Boolean);
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
