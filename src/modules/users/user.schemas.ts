import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'O nome precisa ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    senha: z.string().min(6, 'A senha precisa ter no mínimo 6 caracteres'),
    tipo_usuario: z.enum(['cliente', 'admin']), // Garante que só esses dois valores são aceitos
    telefone: z.string().optional(),
  }),
});