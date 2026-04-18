import { Injectable } from '@nestjs/common';
import { TipoImagem } from '@prisma/client';
import { OffersRepository } from './offers.repository';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { tipoImagemFromMulterFieldname } from '@/shared/utils/tipo-imagem-multer.util';
import { DecimalHelper } from '@/shared/utils/decimal.helper';

@Injectable()
export class OffersService {
  constructor(private repository: OffersRepository) {}

  async createOffer(id_usuario: number, dto: CreateOfferDto, files?: Express.Multer.File[]) {
    const imagens: { url_imagem: string; tipo_imagem: TipoImagem }[] = [];
    for (const f of files || []) {
      if (!/^image\//.test(f.mimetype)) continue;
      const tipo = tipoImagemFromMulterFieldname(f.fieldname);
      if (!tipo) continue;
      imagens.push({ url_imagem: `/uploads/offers/${f.filename}`, tipo_imagem: tipo });
    }

    const created = await this.repository.createOffer(id_usuario, dto, imagens);
    return this.mapOferta(created as any);
  }

  async getMyOffers(id_usuario: number) {
    const rows = await this.repository.getMyOffers(id_usuario);
    return (rows || []).map((o: any) => this.mapOferta(o));
  }

  async getAllOffers() {
    const rows = await this.repository.getAllOffers();
    return (rows || []).map((o: any) => this.mapOferta(o));
  }

  async respondToOffer(id_oferta: number, dto: RespondOfferDto) {
    const updated = await this.repository.respondToOffer(id_oferta, dto);
    return this.mapOferta(updated as any);
  }

  private mapOferta(o: any) {
    const imagens = (o.imagens || []).map((img: any) => ({
      id_imagem_oferta_venda: img.id_imagem_oferta_venda,
      url_imagem: img.url_imagem,
      tipo_imagem: img.tipo_imagem,
    }));

    const base: any = {
      id_oferta_venda: o.id_oferta_venda,
      id_usuario: o.id_usuario,
      titulo_livro: o.titulo_livro,
      autor_livro: o.autor_livro,
      isbn: o.isbn,
      condicao_livro: o.condicao_livro,
      status_oferta: o.status_oferta,
      resposta_admin: o.resposta_admin,
      data_oferta: o.data_oferta,
      imagens,
    };

    if (o.preco_sugerido !== undefined && o.preco_sugerido !== null) {
      base.preco_sugerido = DecimalHelper.toString(o.preco_sugerido);
    }

    return base;
  }
}
