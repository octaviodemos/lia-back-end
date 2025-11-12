import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  async findOrCreateByUserId(id_usuario: number) {
    return this.prisma.carrinho.upsert({
      where: { id_usuario },
      update: {},
      create: { id_usuario },
    });
  }

  async findItemInCart(id_carrinho: number, id_estoque: number) {
    return this.prisma.carrinhoItem.findFirst({
      where: {
        id_carrinho,
        id_estoque,
      },
    });
  }

  async addItem(id_carrinho: number, id_estoque: number, quantidade: number) {
    return this.prisma.carrinhoItem.create({
      data: {
        id_carrinho,
        id_estoque,
        quantidade,
      },
    });
  }

  async updateItemQuantity(id_carrinho_item: number, novaQuantidade: number) {
    return this.prisma.carrinhoItem.update({
      where: { id_carrinho_item },
      data: { quantidade: novaQuantidade },
    });
  }

  async findCartWithDetailsByUserId(id_usuario: number) {
    return this.prisma.carrinho.findUnique({
      where: { id_usuario },
      include: {
        itens: {
          include: {
            estoque: { 
              include: {
                livro: true,
              },
            },
          },
        },
      },
    });
  }
}