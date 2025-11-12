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
    return book;
  }
}