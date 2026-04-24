import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) return null;
    const match = await bcrypt.compare(password, user.senha);
    if (!match) return null;
    // return user without senha
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha, ...safe } = user as any;
    return safe;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const payload = { sub: user.id_usuario, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(dto: any) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new UnauthorizedException('Email já cadastrado');
    const hashed = await bcrypt.hash(dto.password, 10);
    const created = await this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha: hashed,
        telefone: dto.telefone && String(dto.telefone).trim() ? String(dto.telefone).trim() : null,
        tipo_usuario: dto.tipo_usuario || 'cliente',
      },
    });
    // remove senha before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha, ...safe } = created as any;
    return safe;
  }

  async getProfile(id_usuario: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id_usuario },
      select: {
        id_usuario: true,
        nome: true,
        email: true,
        telefone: true,
        tipo_usuario: true,
        created_at: true,
      },
    });
    
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    
    return user;
  }

  async updateProfile(
    id_usuario: number,
    data: { telefone?: string },
  ) {
    const update: { telefone?: string | null } = {};
    if (data.telefone !== undefined) {
      const t = String(data.telefone).trim();
      update.telefone = t.length ? t : null;
    }
    if (Object.keys(update).length === 0) {
      return this.getProfile(id_usuario);
    }
    return this.prisma.usuario.update({
      where: { id_usuario },
      data: update,
      select: {
        id_usuario: true,
        nome: true,
        email: true,
        telefone: true,
        tipo_usuario: true,
        created_at: true,
      },
    });
  }
}
