import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';

@Injectable()
export class OffersRepository {
  constructor(private prisma: PrismaService) {}

  async createOffer(id_usuario: number, dto: CreateOfferDto) {
    return this.prisma.ofertaVenda.create({
      data: {
        ...dto,
        id_usuario,
      },
    });
  }

  async getMyOffers(id_usuario: number) {
    return this.prisma.ofertaVenda.findMany({
      where: { id_usuario },
      select: {
        id_oferta_venda: true,
        titulo_livro: true,
        preco_sugerido: true,
        status_oferta: true,
        resposta_admin: true,
        data_oferta: true,
      },
      orderBy: { data_oferta: 'desc' },
    });
  }

  async getAllOffers() {
    return this.prisma.ofertaVenda.findMany({
      orderBy: { data_oferta: 'desc' },
    });
  }

  async respondToOffer(id_oferta: number, dto: RespondOfferDto) {
    return this.prisma.ofertaVenda.update({
      where: { id_oferta_venda: id_oferta },
      data: dto,
    });
  }
}