import { Injectable } from '@nestjs/common';
import { RepairsRepository } from './repairs.repository';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RespondRepairDto } from './dto/respond-repair.dto';

@Injectable()
export class RepairsService {
  constructor(private repository: RepairsRepository) {}

  async createRequest(id_usuario: number, dto: CreateRepairDto) {
    return this.repository.createRequest(id_usuario, dto);
  }

  async getMyRequests(id_usuario: number) {
    return this.repository.getMyRequests(id_usuario);
  }

  async getAllRequests() {
    return this.repository.getAllRequests();
  }

  async respondToRequest(id_solicitacao: number, dto: RespondRepairDto) {
    return this.repository.respondToRequest(id_solicitacao, dto);
  }
}