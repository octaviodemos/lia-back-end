import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoImagem } from '@prisma/client';
import { BookRepository } from './book.repository';
import { DecimalHelper } from '@/shared/utils/decimal.helper';
import { tipoImagemFromMulterFieldname } from '@/shared/utils/tipo-imagem-multer.util';
import { CreateBookDto } from './dto/create-book.dto';

@Injectable()
export class BookService {
  constructor(private repository: BookRepository) {}

  async create(dto: CreateBookDto, files?: Express.Multer.File[]) {
    if (dto.isbn) {
      const bookExists = await this.repository.findByIsbn(dto.isbn);
      if (bookExists) {
        throw new Error('Já existe um livro cadastrado com este ISBN.');
      }
    }

    const imagemCreates: { url_imagem: string; tipo_imagem: TipoImagem }[] = [];
    for (const f of files || []) {
      if (!/^image\//.test(f.mimetype)) continue;
      const tipo = tipoImagemFromMulterFieldname(f.fieldname);
      if (!tipo) continue;
      imagemCreates.push({ url_imagem: `/uploads/books/${f.filename}`, tipo_imagem: tipo });
    }

    const livroData: Prisma.LivroCreateInput = {
      titulo: dto.titulo,
      sinopse: dto.sinopse || null,
      editora: dto.editora || null,
      ano_publicacao: dto.ano_publicacao ?? null,
      isbn: dto.isbn || null,
    };

    if (imagemCreates.length) {
      livroData.imagens = { create: imagemCreates };
    }

    const created = await this.repository.create(livroData);
    return this.mapLivroDetalhe(created as any);
  }

  async findAll() {
    const books = await this.repository.findAll();

    return (books || []).map((book: any) => {
      const estoqueArr = book.estoque || [];
      const { preco, id_estoque } = this.findLowestPriceInfo(estoqueArr);

      const generos = (book.generos || [])
        .map((lg: any) => {
          if (lg && lg.genero) return { id_genero: lg.genero.id_genero, nome: lg.genero.nome };
          return null;
        })
        .filter(Boolean);

      const autores = (book.autores || [])
        .map((la: any) => {
          if (la && la.autor) return { id_autor: la.autor.id_autor, nome_completo: la.autor.nome_completo };
          return null;
        })
        .filter(Boolean);

      const autoresFinal = autores.length > 0 ? autores : [{ id_autor: null, nome_completo: 'Autor desconhecido' }];

      return {
        id_livro: book.id_livro,
        titulo: book.titulo,
        sinopse: book.sinopse,
        editora: book.editora,
        ano_publicacao: book.ano_publicacao,
        isbn: book.isbn,
        imagens: this.mapImagensLivro(book.imagens),
        preco,
        id_estoque,
        generos,
        autores: autoresFinal,
      };
    });
  }

  async findById(id_livro: number) {
    const book = await this.repository.findById(id_livro);
    if (!book) {
      throw new NotFoundException('Livro não encontrado.');
    }
    return this.mapLivroDetalhe(book as any);
  }

  async getReviews(id_livro: number) {
    const reviews = await this.repository.findApprovedReviewsWithReactions(id_livro);
    return (reviews || []).map((r: any) => ({
      id_avaliacao: r.id_avaliacao,
      id_livro: r.id_livro,
      id_usuario: r.id_usuario,
      nota: r.nota,
      comentario: r.comentario,
      data_avaliacao: r.data_avaliacao,
      usuario: r.usuario ? { id_usuario: r.usuario.id_usuario, nome: r.usuario.nome } : undefined,
      likes: r.likes ?? 0,
      dislikes: r.dislikes ?? 0,
      userReaction: r.userReaction ?? null,
    }));
  }

  async getReviewsWithUser(id_livro: number, id_usuario?: number) {
    const reviews = await this.repository.findApprovedReviewsWithReactions(id_livro, id_usuario);
    return (reviews || []).map((r: any) => ({
      id_avaliacao: r.id_avaliacao,
      id_livro: r.id_livro,
      id_usuario: r.id_usuario,
      nota: r.nota,
      comentario: r.comentario,
      data_avaliacao: r.data_avaliacao,
      usuario: r.usuario ? { id_usuario: r.usuario.id_usuario, nome: r.usuario.nome } : undefined,
      likes: r.likes ?? 0,
      dislikes: r.dislikes ?? 0,
      userReaction: r.userReaction ?? null,
    }));
  }

  async getReactionsForReview(id_avaliacao: number, id_usuario?: number) {
    const counts = await this.repository.countReactionsForReview(id_avaliacao);
    const result: any = { likes: counts.likes, dislikes: counts.dislikes };
    if (id_usuario) {
      const user = await this.repository.getUserReactionForReview(id_avaliacao, id_usuario);
      result.userReaction = user?.tipo ?? null;
    } else {
      result.userReaction = null;
    }
    return result;
  }

  async postReactionForReview(id_avaliacao: number, id_usuario: number, tipo: 'LIKE' | 'DISLIKE') {
    const existing = await this.repository.getUserReactionForReview(id_avaliacao, id_usuario);
    if (!existing) {
      await this.repository.createReactionForReview(id_avaliacao, id_usuario, tipo);
    } else if (existing.tipo === tipo) {
      await this.repository.deleteReactionForReview(id_avaliacao, id_usuario);
    } else {
      await this.repository.updateReactionForReview(id_avaliacao, id_usuario, tipo);
    }
    const counts = await this.repository.countReactionsForReview(id_avaliacao);
    const user = await this.repository.getUserReactionForReview(id_avaliacao, id_usuario);
    return { userReaction: user?.tipo ?? null, likes: counts.likes, dislikes: counts.dislikes };
  }

  async deleteReactionForReview(id_avaliacao: number, id_usuario: number) {
    await this.repository.deleteReactionForReview(id_avaliacao, id_usuario);
    const counts = await this.repository.countReactionsForReview(id_avaliacao);
    return { userReaction: null, likes: counts.likes, dislikes: counts.dislikes };
  }

  async getPendingReviews() {
    const reviews = await this.repository.findPendingReviews();
    return (reviews || []).map((r: any) => ({
      id_avaliacao: r.id_avaliacao,
      id_livro: r.id_livro,
      livro: r.livro
        ? {
            id_livro: r.livro.id_livro,
            titulo: r.livro.titulo,
            imagens: this.mapImagensLivro(r.livro.imagens),
          }
        : undefined,
      id_usuario: r.id_usuario,
      nota: r.nota,
      comentario: r.comentario,
      data_avaliacao: r.data_avaliacao,
      usuario: r.usuario ? { id_usuario: r.usuario.id_usuario, nome: r.usuario.nome } : undefined,
    }));
  }

  async approveReview(id_avaliacao: number) {
    return this.repository.approveReview(id_avaliacao);
  }

  async rejectReview(id_avaliacao: number) {
    return this.repository.deleteReview(id_avaliacao);
  }

  async createReview(id_livro: number, id_usuario: number, dto: { nota: number; comentario?: string }) {
    const livro = await this.repository.findById(id_livro);
    if (!livro) throw new NotFoundException('Livro não encontrado.');

    const created = await this.repository.createReviewForBook(id_livro, id_usuario, {
      nota: dto.nota,
      comentario: dto.comentario || null,
    } as any);

    return {
      id_avaliacao: created.id_avaliacao,
      id_livro: created.id_livro,
      id_usuario: created.id_usuario,
      nota: created.nota,
      comentario: created.comentario,
      data_avaliacao: created.data_avaliacao,
      usuario: created.usuario ? { id_usuario: created.usuario.id_usuario, nome: created.usuario.nome } : undefined,
    };
  }

  private mapImagensLivro(imagens: any[] | undefined) {
    return (imagens || []).map((img) => ({
      id_imagem_livro: img.id_imagem_livro,
      url_imagem: img.url_imagem,
      tipo_imagem: img.tipo_imagem,
    }));
  }

  private mapLivroDetalhe(book: any) {
    const estoque = (book.estoque || []).map((s: any) => ({
      id_estoque: s.id_estoque,
      id_livro: s.id_livro,
      quantidade: s.quantidade,
      preco: DecimalHelper.toString(s.preco),
      condicao: s.condicao,
    }));

    const generos = (book.generos || [])
      .map((lg: any) => {
        if (lg && lg.genero) return { id_genero: lg.genero.id_genero, nome: lg.genero.nome };
        return null;
      })
      .filter(Boolean);

    const autores = (book.autores || [])
      .map((la: any) => {
        if (la && la.autor) return { id_autor: la.autor.id_autor, nome_completo: la.autor.nome_completo };
        return null;
      })
      .filter(Boolean);

    const autoresFinal = autores.length > 0 ? autores : [{ id_autor: null, nome_completo: 'Autor desconhecido' }];

    return {
      id_livro: book.id_livro,
      titulo: book.titulo,
      sinopse: book.sinopse,
      editora: book.editora,
      ano_publicacao: book.ano_publicacao,
      isbn: book.isbn,
      imagens: this.mapImagensLivro(book.imagens),
      estoque,
      generos,
      autores: autoresFinal,
    };
  }

  private findLowestPriceInfo(estoqueArr: any[]): { preco: string | null; id_estoque: number | null } {
    if (!Array.isArray(estoqueArr) || estoqueArr.length === 0) return { preco: null, id_estoque: null };

    let min: number | null = null;
    let minId: number | null = null;

    for (const s of estoqueArr) {
      const precoRaw = s && s.preco;
      const num = DecimalHelper.toNumber(precoRaw);

      if (num > 0 && (min === null || num < min)) {
        min = num;
        minId = s.id_estoque ?? null;
      }
    }

    return { preco: min !== null ? min.toFixed(2) : null, id_estoque: minId };
  }
}
