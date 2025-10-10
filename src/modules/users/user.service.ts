import { hash } from 'bcryptjs';
import { UserRepository } from './user.repository';
import { Prisma } from '@prisma/client';

export class UserService {
  constructor(private repository: UserRepository) {}

  async create(data: Prisma.UsuarioCreateInput) {
    const userExists = await this.repository.findByEmail(data.email);
    if (userExists) {
      throw new Error('Este email já está em uso.');
    }

    const hashedPassword = await hash(data.senha, 10); 

    const user = await this.repository.create({
      ...data,
      senha: hashedPassword,
    });

    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}