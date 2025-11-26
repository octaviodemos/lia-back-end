import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesRepository {
  constructor(private prisma: PrismaService) {}

  async getAddresses(id_usuario: number) {
    return this.prisma.enderecosEntrega.findMany({
      where: { id_cliente: id_usuario },
      select: {
        id_endereco: true,
        rua: true,
        numero: true,
        complemento: true,
        cep: true,
        cidade: true,
        estado: true,
      },
    });
  }

  async addAddress(id_usuario: number, dto: CreateAddressDto) {
    return this.prisma.enderecosEntrega.create({
      data: {
        ...dto,
        id_cliente: id_usuario,
      },
    });
  }
}