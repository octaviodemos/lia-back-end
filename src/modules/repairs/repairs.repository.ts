import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RespondRepairDto } from './dto/respond-repair.dto';

@Injectable()
export class RepairsRepository {
  constructor(private prisma: PrismaService) {}

  async createRequest(id_usuario: number, dto: CreateRepairDto) {
    return this.prisma.solicitacaoReforma.create({
      data: {
        ...dto,
        id_usuario,
      },
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

  async respondToRequest(id_solicitacao: number, dto: RespondRepairDto) {
    return this.prisma.solicitacaoReforma.update({
      where: { id_solicitacao },
      data: dto,
    });
  }
}