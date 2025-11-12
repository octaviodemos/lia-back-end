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
    return this.repository.findAll();
  }

  async findById(id_livro: number) {
    const book = await this.repository.findById(id_livro);
    if (!book) {
      throw new NotFoundException('Livro não encontrado.');
    }

    // `book` agora inclui as linhas relacionadas de `estoque` graças ao include no repositório.
    // Retorna um único objeto que contém os campos do livro e um array `estoque`
    // com preco, condicao e quantidade conforme solicitado.
    const estoque = ((book as any).estoque || []).map((s: any) => {
      const precoRaw = s.preco;
      const preco = typeof precoRaw === 'object' && precoRaw?.toNumber ? precoRaw.toNumber() : Number(precoRaw);
      return {
        id_estoque: s.id_estoque,
        id_livro: s.id_livro,
        quantidade: s.quantidade,
        preco,
        condicao: s.condicao,
        created_at: s.created_at || null,
      };
    });

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
}