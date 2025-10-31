import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { UserRepository } from '@/modules/users/user.repository';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async login(email: string, senhaInserida: string) {
   
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Email ou senha inválidos.');
    }

    const passwordMatch = await compare(senhaInserida, user.senha);
    if (!passwordMatch) {
      throw new Error('Email ou senha inválidos.');
    }

    const token = sign({}, process.env.JWT_SECRET || 'fallback_secret_key', {
      subject: String(user.id_usuario),
      expiresIn: '1d',
    });

    return { token };
  }
}