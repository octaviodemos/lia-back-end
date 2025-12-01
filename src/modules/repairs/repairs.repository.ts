import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RespondRepairDto } from './dto/respond-repair.dto';

@Injectable()
export class RepairsRepository {
  constructor(private prisma: PrismaService) {}

  async createRequest(id_usuario: number, dto: CreateRepairDto, fotos: Express.Multer.File[] = []) {
    const data: any = {
      ...dto,
      id_usuario,
    };

    if (fotos && fotos.length) {
      data.fotos = {
        create: fotos.map((f) => ({ url_foto: `/uploads/repairs/${f.filename}` })),
      };
    }

    return this.prisma.solicitacaoReforma.create({
      data,
      include: { fotos: true },
    });
  }

  async getMyRequests(id_usuario: number) {
    return this.prisma.solicitacaoReforma.findMany({
      where: { id_usuario },
      select: {
        id_solicitacao: true,
        descricao_problema: true,
        status_solicitacao: true,
        data_solicitacao: true,
      },
      orderBy: { data_solicitacao: 'desc' },
    });
  }

  async getAllRequests() {
    return this.prisma.solicitacaoReforma.findMany({
      orderBy: { data_solicitacao: 'desc' },
    });
  }

  async findAllAdmin(opts: { page: number; limit: number; status?: string; q?: string; sort?: string }) {
    const { page, limit, status, q, sort } = opts;
    const where: any = {};
    if (status) where.status_solicitacao = status;
    if (q) where.descricao_problema = { contains: q, mode: 'insensitive' };

    const orderBy: any = {};
    if (sort === 'oldest') orderBy.data_solicitacao = 'asc';
    else orderBy.data_solicitacao = 'desc';

    const take = Math.min(100, Math.max(1, limit || 20));
    const skip = Math.max(0, (Math.max(1, page || 1) - 1) * take);

    const [data, total] = await Promise.all([
      this.prisma.solicitacaoReforma.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { fotos: true, usuario: { select: { id_usuario: true, nome: true, email: true } } },
      }),
      this.prisma.solicitacaoReforma.count({ where }),
    ]);

    return { data, total };
  }

  async respondToRequest(id_solicitacao: number, dto: RespondRepairDto) {
    return this.prisma.solicitacaoReforma.update({
      where: { id_solicitacao },
      data: dto,
    });
  }
}