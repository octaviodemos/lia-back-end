import { z } from 'zod';

export const addItemToCartSchema = z.object({
  body: z.object({
    id_estoque: z.number().int().positive('O ID do item em estoque é obrigatório.'),
    quantidade: z.number().int().positive('A quantidade deve ser de no mínimo 1.'),
  }),
})