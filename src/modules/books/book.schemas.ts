import { z } from 'zod';

export const createBookSchema = z.object({
  body: z.object({
    titulo: z.string().min(1, 'O título é obrigatório'),
    sinopse: z.string().optional(),
    editora: z.string().optional(),
    ano_publicacao: z.number().int().optional(),
    isbn: z.string().optional(),
    capa_url: z.string().url('A URL da capa deve ser válida').optional(),
  }),
});