import { Request, Response } from 'express';
import { UserService } from './user.service';
import { createUserSchema } from './user.schemas';

export class UserController {
  constructor(private service: UserService) {}

  async create(req: Request, res: Response) {
    try {
      const { body } = createUserSchema.parse(req);

      const user = await this.service.create(body);

      return res.status(201).json(user);
    } catch (error: any) {
      if (error.message === 'Este email já está em uso.') {
        return res.status(409).json({ message: error.message });
      }

      return res.status(400).json({ message: 'Erro ao criar usuário', details: error.errors });
    }
  }
}