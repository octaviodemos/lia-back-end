import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
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

  async findById(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: id },
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
