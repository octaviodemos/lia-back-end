import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesRepository {
  constructor(private prisma: PrismaService) {}

  async getAddresses(id_usuario: number) {
    const addresses = await this.prisma.enderecosEntrega.findMany({
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

    // Formatar CEP na resposta
    return addresses.map(addr => ({
      ...addr,
      cep: addr.cep ? this.formatarCep(addr.cep) : addr.cep,
    }));
  }

  async addAddress(id_usuario: number, dto: CreateAddressDto) {
    const normalizedDto = {
      ...dto,
      cep: this.normalizeCep(dto.cep),
      estado: dto.estado.toUpperCase(),
    };

    return this.prisma.enderecosEntrega.create({
      data: {
        ...normalizedDto,
        id_cliente: id_usuario,
      },
    });
  }

  private normalizeCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  private formatarCep(cep: string): string {
    const cepLimpo = this.normalizeCep(cep);
    return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
}