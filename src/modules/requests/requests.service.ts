import { Injectable } from '@nestjs/common';
import { OffersService } from '../offers/offers.service';
import { RepairsService } from '../repairs/repairs.service';

@Injectable()
export class RequestsService {
  constructor(private offers: OffersService, private repairs: RepairsService) {}

  async getMyRequests(id_usuario: number) {
    const [offers, repairs] = await Promise.all([
      this.offers.getMyOffers(id_usuario),
      this.repairs.getMyRequests(id_usuario),
    ]);
    return { offers, repairs };
  }

  async getAdminPending() {
    const [allOffers, allRepairs] = await Promise.all([this.offers.getAllOffers(), this.repairs.getAllRequests()]);
    const pendingOffers = (allOffers || []).filter((o: any) => (o.status_oferta || o.status) === 'pendente');
    const pendingRepairs = (allRepairs || []).filter((r: any) => (r.status_solicitacao || r.status) === 'pendente');
    return { pendingOffers, pendingRepairs };
  }

  async respondToOffer(id_oferta: number, dto: any) {
    return this.offers.respondToOffer(id_oferta, dto);
  }

  async respondToRepair(id_solicitacao: number, dto: any) {
    return this.repairs.respondToRequest(id_solicitacao, dto);
  }
}
