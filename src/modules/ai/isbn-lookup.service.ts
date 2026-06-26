import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export type BookMetadataLookupResult = {
  isbn: string | null;
  autor: string | null;
  editora: string | null;
  ano_publicacao: number | null;
  sinopse: string | null;
};

type OpenLibraryDoc = {
  isbn?: string[];
  title?: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibraryDoc[];
};

type GoogleBooksVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
  };
};

type GoogleBooksResponse = {
  items?: GoogleBooksVolume[];
};

const METADATA_VAZIO: BookMetadataLookupResult = {
  isbn: null,
  autor: null,
  editora: null,
  ano_publicacao: null,
  sinopse: null,
};

const LOOKUP_HTTP_TIMEOUT_MS = 4000;

@Injectable()
export class IsbnLookupService {
  private readonly logger = new Logger(IsbnLookupService.name);

  constructor(private readonly http: HttpService) {}

  async lookupMetadata(titulo: string, autor?: string): Promise<BookMetadataLookupResult> {
    const title = titulo.trim();
    if (!title) {
      return { ...METADATA_VAZIO };
    }

    const autorNorm = autor?.trim() || undefined;
    const [openLibrary, google] = await Promise.all([
      this.buscarOpenLibrary(title, autorNorm),
      this.buscarGoogleBooks(title, autorNorm),
    ]);

    return this.combinarMetadados(openLibrary, google);
  }

  async lookupByTitleAndAuthor(titulo: string, autor?: string): Promise<string | null> {
    const meta = await this.lookupMetadata(titulo, autor);
    return meta.isbn;
  }

  normalizeIsbn(valor: string | null | undefined): string | null {
    if (!valor?.trim()) {
      return null;
    }
    const digits = valor.replace(/\D/g, '');
    if (digits.length === 13 || digits.length === 10) {
      return digits;
    }
    return null;
  }

  private combinarMetadados(...fontes: BookMetadataLookupResult[]): BookMetadataLookupResult {
    const resultado: BookMetadataLookupResult = { ...METADATA_VAZIO };

    for (const fonte of fontes) {
      if (!resultado.isbn && fonte.isbn) {
        resultado.isbn = fonte.isbn;
      }
      if (!resultado.autor && fonte.autor) {
        resultado.autor = fonte.autor;
      }
      if (!resultado.editora && fonte.editora) {
        resultado.editora = fonte.editora;
      }
      if (!resultado.ano_publicacao && fonte.ano_publicacao) {
        resultado.ano_publicacao = fonte.ano_publicacao;
      }
      if (!resultado.sinopse && fonte.sinopse) {
        resultado.sinopse = fonte.sinopse;
      }
    }

    return resultado;
  }

  private async buscarOpenLibrary(titulo: string, autor?: string): Promise<BookMetadataLookupResult> {
    const consulta = autor ? `${titulo} ${autor}` : titulo;
    const url = `https://openlibrary.org/search.json?${new URLSearchParams({
      q: consulta,
      limit: '5',
    }).toString()}`;

    try {
      const res = await firstValueFrom(
        this.http.get<OpenLibrarySearchResponse>(url, {
          timeout: LOOKUP_HTTP_TIMEOUT_MS,
          validateStatus: () => true,
        }),
      );
      if (res.status < 200 || res.status >= 300) {
        return { ...METADATA_VAZIO };
      }

      const docs = res.data?.docs ?? [];
      const doc = this.escolherMelhorOpenLibraryDoc(docs, titulo, autor);
      if (!doc) {
        return { ...METADATA_VAZIO };
      }

      return {
        isbn: this.pickBestIsbn(doc.isbn ?? []),
        autor: doc.author_name?.[0]?.trim() || null,
        editora: doc.publisher?.[0]?.trim() || null,
        ano_publicacao: this.parseAno(doc.first_publish_year),
        sinopse: null,
      };
    } catch (err) {
      this.logger.warn(
        `Falha ao buscar no Open Library: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { ...METADATA_VAZIO };
    }
  }

  private escolherMelhorOpenLibraryDoc(
    docs: OpenLibraryDoc[],
    titulo: string,
    autor?: string,
  ): OpenLibraryDoc | null {
    if (!docs.length) {
      return null;
    }

    const tituloNorm = this.normalizarParaComparacao(titulo);
    const autorNorm = autor ? this.normalizarParaComparacao(autor) : '';

    let melhor: OpenLibraryDoc | null = null;
    let melhorPontuacao = -1;

    for (const doc of docs) {
      const docTitulo = this.normalizarParaComparacao(doc.title ?? '');
      if (!docTitulo) {
        continue;
      }

      let pontuacao = 0;
      if (docTitulo === tituloNorm) {
        pontuacao += 5;
      } else if (docTitulo.includes(tituloNorm) || tituloNorm.includes(docTitulo)) {
        pontuacao += 3;
      }

      if (autorNorm) {
        const autoresDoc = (doc.author_name ?? []).map((nome) => this.normalizarParaComparacao(nome));
        if (autoresDoc.some((nome) => nome.includes(autorNorm) || autorNorm.includes(nome))) {
          pontuacao += 2;
        }
      }

      if ((doc.isbn ?? []).length > 0) {
        pontuacao += 1;
      }

      if (pontuacao > melhorPontuacao) {
        melhorPontuacao = pontuacao;
        melhor = doc;
      }
    }

    return melhor ?? docs[0] ?? null;
  }

  private async buscarGoogleBooks(titulo: string, autor?: string): Promise<BookMetadataLookupResult> {
    const termos = [`intitle:${titulo}`];
    if (autor) {
      termos.push(`inauthor:${autor}`);
    }
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termos.join('+'))}&maxResults=5&langRestrict=pt`;

    try {
      const res = await firstValueFrom(
        this.http.get<GoogleBooksResponse>(url, {
          timeout: LOOKUP_HTTP_TIMEOUT_MS,
          validateStatus: () => true,
        }),
      );
      if (res.status < 200 || res.status >= 300) {
        return { ...METADATA_VAZIO };
      }

      const items = res.data?.items ?? [];
      const volume = this.escolherMelhorGoogleVolume(items, titulo, autor);
      if (!volume?.volumeInfo) {
        return { ...METADATA_VAZIO };
      }

      const info = volume.volumeInfo;
      const isbn =
        this.pickBestIsbn(
          (info.industryIdentifiers ?? [])
            .map((item) => item.identifier ?? '')
            .filter(Boolean),
        ) ?? null;

      return {
        isbn,
        autor: info.authors?.join(', ').trim() || null,
        editora: info.publisher?.trim() || null,
        ano_publicacao: this.parseAno(info.publishedDate),
        sinopse: info.description?.trim() || null,
      };
    } catch (err) {
      this.logger.warn(
        `Falha ao buscar no Google Books: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { ...METADATA_VAZIO };
    }
  }

  private escolherMelhorGoogleVolume(
    items: GoogleBooksVolume[],
    titulo: string,
    autor?: string,
  ): GoogleBooksVolume | null {
    if (!items.length) {
      return null;
    }

    const tituloNorm = this.normalizarParaComparacao(titulo);
    const autorNorm = autor ? this.normalizarParaComparacao(autor) : '';

    let melhor: GoogleBooksVolume | null = null;
    let melhorPontuacao = -1;

    for (const item of items) {
      const info = item.volumeInfo;
      if (!info?.title) {
        continue;
      }

      const docTitulo = this.normalizarParaComparacao(info.title);
      let pontuacao = 0;

      if (docTitulo === tituloNorm) {
        pontuacao += 5;
      } else if (docTitulo.includes(tituloNorm) || tituloNorm.includes(docTitulo)) {
        pontuacao += 3;
      }

      if (autorNorm) {
        const autoresDoc = (info.authors ?? []).map((nome) => this.normalizarParaComparacao(nome));
        if (autoresDoc.some((nome) => nome.includes(autorNorm) || autorNorm.includes(nome))) {
          pontuacao += 2;
        }
      }

      if ((info.industryIdentifiers ?? []).length > 0) {
        pontuacao += 1;
      }

      if (pontuacao > melhorPontuacao) {
        melhorPontuacao = pontuacao;
        melhor = item;
      }
    }

    return melhor ?? items[0] ?? null;
  }

  private normalizarParaComparacao(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLocaleLowerCase('pt-BR')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseAno(valor: unknown): number | null {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      const ano = Math.trunc(valor);
      return ano >= 1000 && ano <= 2100 ? ano : null;
    }
    if (valor == null) {
      return null;
    }
    const match = String(valor).match(/\d{4}/);
    if (!match) {
      return null;
    }
    const ano = parseInt(match[0], 10);
    return ano >= 1000 && ano <= 2100 ? ano : null;
  }

  private pickBestIsbn(isbns: string[]): string | null {
    const normalizados = isbns
      .map((raw) => this.normalizeIsbn(raw))
      .filter((v): v is string => v != null);

    const isbn13 = normalizados.find((v) => v.length === 13);
    if (isbn13) {
      return isbn13;
    }

    const isbn10 = normalizados.find((v) => v.length === 10);
    return isbn10 ?? null;
  }
}
