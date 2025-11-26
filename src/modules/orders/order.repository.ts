import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class OrderRepository {
  constructor(private prisma: PrismaService) {}

  async findCartWithItemsByUserId(id_usuario: number) {
    return this.prisma.carrinho.findUnique({
      where: { id_usuario },
      include: {
        itens: { include: { estoque: true } },
      },
    });
  }

  async getMyOrders(id_usuario: number) {
    return this.prisma.pedido.findMany({
      where: { id_cliente: id_usuario },
      select: {
        id_pedido: true,
        data_pedido: true,
        status_pedido: true,
        itens: {
          select: {
            preco_unitario: true,
            quantidade: true,
          },
        },
      },
      orderBy: { data_pedido: 'desc' },
    });
  }

  /**
   * Finalize an order from a user's cart: attempt to decrement stock for all items,
   * create Pedido, ItemPedido and Pagamento, and clear the cart. All inside a transaction.
   */
  async finalizeOrderFromCart(id_usuario: number, paymentPayload: any) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.carrinho.findUnique({
        where: { id_usuario },
        include: { itens: { include: { estoque: true } } },
      });

      if (!cart || !cart.itens || cart.itens.length === 0) {
        throw new Error('Carrinho vazio.');
      }

      // Attempt to decrement stock for each item.
      for (const item of cart.itens) {
        const id_estoque = item.id_estoque;
        const quantidade = item.quantidade;

        const updated = await tx.estoque.updateMany({
          where: { id_estoque, quantidade: { gte: quantidade } },
          data: { quantidade: { decrement: quantidade } },
        });

        if (updated.count === 0) {
          // Determine whether item missing or insufficient
          const maybeStock = await tx.estoque.findUnique({ where: { id_estoque } });
          if (!maybeStock) throw new Error(`Item de estoque não encontrado (id_estoque=${id_estoque}).`);
          throw new Error(`Quantidade insuficiente para id_estoque=${id_estoque}.`);
        }
      }

      // Create Pedido
      const pedido = await tx.pedido.create({
        data: {
          id_cliente: id_usuario,
          status_pedido: 'paid',
        },
      });

      // Create ItemPedido entries (snapshot price from estoque)
      const itemsToCreate = cart.itens.map((it) => ({
        id_pedido: pedido.id_pedido,
        id_estoque: it.id_estoque,
        quantidade: it.quantidade,
        preco_unitario: it.estoque.preco,
      }));

      for (const it of itemsToCreate) {
        await tx.itemPedido.create({ data: it });
      }

      // Create Pagamento record
      await tx.pagamento.create({
        data: {
          id_pedido: pedido.id_pedido,
          status_pagamento: paymentPayload?.status_pagamento ?? 'confirmed',
          id_transacao_gateway: paymentPayload?.id_transacao_gateway,
          valor_pago: paymentPayload?.valor_pago ?? null,
          metodo_pagamento: paymentPayload?.metodo_pagamento ?? null,
          payload_completo_gateway: paymentPayload ?? null,
        },
      });

      // Clear cart items
      await tx.carrinhoItem.deleteMany({ where: { id_carrinho: cart.id_carrinho } });

      return pedido;
    });
  }
}
