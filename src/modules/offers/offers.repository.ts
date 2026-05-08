import { Injectable } from '@nestjs/common';
import { Prisma, TipoImagem } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';

@Injectable()
export class OffersRepository {
  constructor(private prisma: PrismaService) {}

  async createOffer(
    id_usuario: number,
    dto: CreateOfferDto,
    imagens: { url_imagem: string; tipo_imagem: TipoImagem }[],
  ) {
    const data: Prisma.OfertaVendaCreateInput = {
      titulo_livro: dto.titulo_livro,
      autor_livro: dto.autor_livro ?? null,
      isbn: dto.isbn ?? null,
      condicao_livro: dto.condicao_livro,
      preco_sugerido: dto.preco_sugerido,
      usuario: { connect: { id_usuario } },
    };

    if (imagens.length) {
      data.imagens = { create: imagens };
    }

    return this.prisma.ofertaVenda.create({
      data,
      include: { imagens: true },
    });
  }

  async getMyOffers(id_usuario: number) {
    return this.prisma.ofertaVenda.findMany({
      where: { id_usuario },
      select: {
        id_oferta_venda: true,
        id_usuario: true,
        titulo_livro: true,
        autor_livro: true,
        isbn: true,
        condicao_livro: true,
        preco_sugerido: true,
        status_oferta: true,
        resposta_admin: true,
        data_oferta: true,
        imagens: true,
      },
      orderBy: { data_oferta: 'desc' },
    });
  }

  async getAllOffers() {
    return this.prisma.ofertaVenda.findMany({
      orderBy: { data_oferta: 'desc' },
      include: { imagens: true },
    });
  }

  async respondToOffer(id_oferta: number, dto: RespondOfferDto) {
    return this.prisma.ofertaVenda.update({
      where: { id_oferta_venda: id_oferta },
      data: dto,
      include: { imagens: true },
    });
  }

  async findByIdWithImagens(id_oferta_venda: number) {
    return this.prisma.ofertaVenda.findUnique({
      where: { id_oferta_venda },
      include: { imagens: true },
    });
  }
}
