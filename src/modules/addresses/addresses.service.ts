import { Injectable } from '@nestjs/common';
import { AddressesRepository } from './addresses.repository';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(private repository: AddressesRepository) {}

  async getAddresses(id_usuario: number) {
    return this.repository.getAddresses(id_usuario);
  }

  async addAddress(id_usuario: number, dto: CreateAddressDto) {
    return this.repository.addAddress(id_usuario, dto);
  }
}