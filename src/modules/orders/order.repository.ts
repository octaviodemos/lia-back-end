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
            estoque: {
              select: {
                id_estoque: true,
                livro: {
                  select: {
                    id_livro: true,
                    titulo: true,
                  }
                }
              }
            }
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
          const maybeStock = await tx.estoque.findUnique({ where: { id_estoque } });
          if (!maybeStock) throw new Error(`Item de estoque não encontrado (id_estoque=${id_estoque}).`);
          throw new Error(`Quantidade insuficiente para id_estoque=${id_estoque}.`);
        }
      }

      const pedidoData: any = {
        id_cliente: id_usuario,
        status_pedido: 'paid',
      };

      const pedido = await tx.pedido.create({ data: pedidoData });

      const itemsToCreate = cart.itens.map((it) => ({
        id_pedido: pedido.id_pedido,
        id_estoque: it.id_estoque,
        quantidade: it.quantidade,
        preco_unitario: it.estoque.preco,
      }));

      for (const it of itemsToCreate) {
        await tx.itemPedido.create({ data: it });
      }

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

      await tx.carrinhoItem.deleteMany({ where: { id_carrinho: cart.id_carrinho } });

      return pedido;
    });
  }

  async updateOrderStatusByExternalReference(externalReference: string, status: string) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        pagamento: {
          id_transacao_gateway: externalReference
        }
      },
      include: {
        pagamento: true
      }
    });

    if (!pedido) {
      throw new Error(`Pedido não encontrado com external_reference: ${externalReference}`);
    }

    // Atualizar status do pedido
    const updatedPedido = await this.prisma.pedido.update({
      where: {
        id_pedido: pedido.id_pedido
      },
      data: {
        status_pedido: status
      }
    });

    // Atualizar status do pagamento também
    if (pedido.pagamento) {
      await this.prisma.pagamento.update({
        where: {
          id_pagamento: pedido.pagamento.id_pagamento
        },
        data: {
          status_pagamento: status
        }
      });
    }

    return updatedPedido;
  }

  async getOrderStatusByExternalReference(externalReference: string, userId?: number) {
    const whereCondition: any = {
      pagamento: {
        id_transacao_gateway: externalReference
      }
    };

    // Se userId fornecido, filtrar apenas pedidos do usuário
    if (userId) {
      whereCondition.id_cliente = userId;
    }

    const pedido = await this.prisma.pedido.findFirst({
      where: whereCondition,
      include: {
        pagamento: true,
        cliente: {
          select: {
            id_usuario: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!pedido) {
      throw new Error(`Pedido não encontrado com external_reference: ${externalReference}`);
    }

    return {
      id_pedido: pedido.id_pedido,
      status_pedido: pedido.status_pedido,
      data_pedido: pedido.data_pedido,
      external_reference: externalReference,
      pagamento: pedido.pagamento ? {
        status_pagamento: pedido.pagamento.status_pagamento,
        metodo_pagamento: pedido.pagamento.metodo_pagamento,
        valor_pago: pedido.pagamento.valor_pago
      } : null,
      cliente: pedido.cliente
    };
  }

  async findById(id_pedido: number, id_usuario?: number) {
    const whereCondition: any = { id_pedido };
    if (id_usuario) whereCondition.id_cliente = id_usuario;

    return this.prisma.pedido.findFirst({
      where: whereCondition,
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
        pagamento: true,
        cliente: {
          select: { id_usuario: true, nome: true, email: true },
        },
      },
    });
  }

  async findAndCountAdmin(opts: { page: number; limit: number; status?: string; q?: string; sort?: string }) {
    const { page, limit, status, q, sort } = opts;

    const where: any = {};
    if (status) where.status_pedido = status;

    if (q) {
      const qNum = Number(q);
      const or: any[] = [];
      if (!isNaN(qNum)) or.push({ id_pedido: qNum });
      or.push({ cliente: { nome: { contains: q, mode: 'insensitive' } } });
      or.push({ cliente: { email: { contains: q, mode: 'insensitive' } } });
      where.OR = or;
    }

    // sort parsing: expected like 'data_pedido:desc' or 'data_pedido:asc'
    let orderBy: any = { data_pedido: 'desc' };
    if (sort) {
      const [field, dir] = sort.split(':');
      if (field && dir && (dir === 'asc' || dir === 'desc')) {
        orderBy = { [field]: dir };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        include: {
          itens: { include: { estoque: { include: { livro: true } } } },
          pagamento: true,
          cliente: { select: { id_usuario: true, nome: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return { items, total };
  }

  async updateStatusById(id_pedido: number, status: string) {
    return this.prisma.pedido.update({
      where: { id_pedido },
      data: { status_pedido: status },
    });
  }
}
