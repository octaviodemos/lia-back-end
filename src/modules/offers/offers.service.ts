import { Injectable } from '@nestjs/common';
import { OffersRepository } from './offers.repository';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';

@Injectable()
export class OffersService {
  constructor(private repository: OffersRepository) {}

  async createOffer(id_usuario: number, dto: CreateOfferDto) {
    return this.repository.createOffer(id_usuario, dto);
  }

  async getMyOffers(id_usuario: number) {
    return this.repository.getMyOffers(id_usuario);
  }

  async getAllOffers() {
    return this.repository.getAllOffers();
  }

  async respondToOffer(id_oferta: number, dto: RespondOfferDto) {
    return this.repository.respondToOffer(id_oferta, dto);
  }
}