import { Request, Response } from 'express';
import { BookService } from './book.service';
import { createBookSchema } from './book.schemas';

export class BookController {
  constructor(private service: BookService) {}

  async create(req: Request, res: Response) {
    try {
      const { body } = createBookSchema.parse(req);
      const newBook = await this.service.create(body);
      return res.status(201).json(newBook);
    } catch (error: any) {
      if (error.message.includes('ISBN')) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(400).json({ message: 'Erro ao criar livro', details: error.errors || error.message });
    }
  }

  async findAll(_req: Request, res: Response) {
    try {
      const books = await this.service.findAll();
      return res.status(200).json(books);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao buscar livros.' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const book = await this.service.findById(id);
      return res.status(200).json(book);
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao buscar livro.' });
    }
  }
}