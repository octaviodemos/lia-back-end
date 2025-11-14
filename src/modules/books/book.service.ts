import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BookRepository } from './book.repository';

@Injectable()
export class BookService {
  constructor(private repository: BookRepository) {}

  async create(data: Prisma.LivroCreateInput) {
    if (data.isbn) {
      const bookExists = await this.repository.findByIsbn(data.isbn);
      if (bookExists) {
        throw new Error('Já existe um livro cadastrado com este ISBN.');
      }
    }

    return this.repository.create(data);
  }

  async findAll() {
    const books = await this.repository.findAll();

    return (books || []).map((book: any) => {
      const estoqueArr = book.estoque || [];
      const { preco, id_estoque } = this.findLowestPriceInfo(estoqueArr);

      return {
        id_livro: book.id_livro,
        titulo: book.titulo,
        sinopse: book.sinopse,
        editora: book.editora,
        ano_publicacao: book.ano_publicacao,
        isbn: book.isbn,
        capa_url: book.capa_url,
        preco,
        id_estoque,
      };
    });
  }

  async findById(id_livro: number) {
    const book = await this.repository.findById(id_livro);
    if (!book) {
      throw new NotFoundException('Livro não encontrado.');
    }

    const estoque = ((book as any).estoque || []).map((s: any) => ({
      id_estoque: s.id_estoque,
      id_livro: s.id_livro,
      quantidade: s.quantidade,
      preco: this.formatDecimalToPrice(s.preco),
      condicao: s.condicao,
    }));

    return {
      id_livro: book.id_livro,
      titulo: book.titulo,
      sinopse: book.sinopse,
      editora: book.editora,
      ano_publicacao: book.ano_publicacao,
      isbn: book.isbn,
      capa_url: book.capa_url,
      estoque,
    };
  }

   private formatDecimalToPrice(precoRaw: any): string | null {
    if (precoRaw === null || precoRaw === undefined) return null;
    try {
      let precoStr: string;
      if (typeof precoRaw === 'object' && typeof precoRaw.toString === 'function') {
        precoStr = precoRaw.toString();
      } else {
        precoStr = String(precoRaw);
      }
      const num = Number(precoStr);
      return Number.isFinite(num) ? num.toFixed(2) : null;
    } catch (e) {
      return null;
    }
  }

  private findLowestPriceInfo(estoqueArr: any[]): { preco: string | null; id_estoque: number | null } {
    if (!Array.isArray(estoqueArr) || estoqueArr.length === 0) return { preco: null, id_estoque: null };

    let min: number | null = null;
    let minId: number | null = null;

    for (const s of estoqueArr) {
      const precoRaw = s && s.preco;
      const precoStr = this.formatDecimalToPrice(precoRaw);
      if (precoStr === null) continue;
      const num = Number(precoStr);
      if (min === null || num < min) {
        min = num;
        minId = s.id_estoque ?? null;
      }
    }

    return { preco: min !== null ? min.toFixed(2) : null, id_estoque: minId };
  }
}