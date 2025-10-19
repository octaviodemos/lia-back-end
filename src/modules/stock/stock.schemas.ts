import { z } from 'zod';

export const createStockItemSchema = z.object({
  body: z.object({
    id_livro: z.number().int().positive('O ID do livro é obrigatório.'),
    quantidade: z.number().int().min(0, 'A quantidade não pode ser negativa.'),
    preco: z.number().positive('O preço deve ser um valor positivo.'),
    condicao: z.string().optional(),
  }),
})

export const updateStockItemSchema = z.object({
  body: z.object({
    quantidade: z.number().int().min(0, 'A quantidade não pode ser negativa.').optional(),
    preco: z.number().positive('O preço deve ser um valor positivo.').optional(),
    condicao: z.string().optional(),
  }),
});