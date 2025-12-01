import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { mapOrderStatusToLabel } from '@/shared/utils/status.util';

@Injectable()
export class OrderService {
  constructor(private orderRepository: OrderRepository) {}

  async finalizeOrderFromCart(id_usuario: number, paymentPayload: any) {
    try {
      const pedido = await this.orderRepository.finalizeOrderFromCart(id_usuario, paymentPayload);
      return pedido;
    } catch (err: any) {
      const msg = err?.message ?? err;
      if (msg.includes('Carrinho vazio')) {
        throw new BadRequestException(msg);
      }
      if (msg.includes('insuficiente') || msg.includes('não encontrado')) {
        throw new BadRequestException(msg);
      }
      throw err;
    }
  }

  async getMyOrders(id_usuario: number) {
    const rows = await this.orderRepository.getMyOrders(id_usuario);
    // Normalize decimals and compute totals for each order from items
    const enriched = (rows || []).map((r: any) => this.normalizeOrder(r));
    return enriched;
  }

  async getOrderById(id_usuario: number, id_pedido: number) {
    const pedido = await this.orderRepository.findById(id_pedido, id_usuario);
    if (!pedido) throw new BadRequestException('Pedido não encontrado');
    return this.normalizeOrder(pedido);
  }

  async findAllAdmin(opts: { page?: number; limit?: number; status?: string; q?: string; sort?: string }) {
    const page = Math.max(1, Number(opts.page ?? 1));
    const limit = Math.min(100, Number(opts.limit ?? 20));

    const { items, total } = await this.orderRepository.findAndCountAdmin({
      page,
      limit,
      status: opts.status,
      q: opts.q,
      sort: opts.sort,
    });

    const normalized = (items || []).map((it: any) => this.normalizeOrder(it));

    return {
      items: normalized,
      total,
      page,
      perPage: limit,
    };
  }

  async updateStatusById(id_pedido: number, status: string) {
    if (!status) throw new Error('status is required');
    const updated = await this.orderRepository.updateStatusById(id_pedido, status);
    return this.normalizeOrder(updated);
  }

  private normalizeOrder(pedido: any) {
    if (!pedido) return pedido;

    const cloned = { ...pedido } as any;

    if (Array.isArray(cloned.itens)) {
      cloned.itens = cloned.itens.map((it: any) => {
        // resolve preco unitario: prefer explicit field, fallback to estoque.preco
        const rawPreco = it.preco_unitario ?? it.estoque?.preco ?? null;

        let precoNumber: number | null = null;
        if (rawPreco != null) {
          if (typeof rawPreco === 'object' && typeof rawPreco.toNumber === 'function') {
            precoNumber = rawPreco.toNumber();
          } else {
            precoNumber = Number(rawPreco);
          }
        }

        const preco_cents = precoNumber != null ? Math.round(precoNumber * 100) : null;

        // normalize estoque.livro information
        const livro = it.estoque?.livro
          ? {
              id_livro: it.estoque.livro.id_livro ?? it.estoque.livro.id,
              titulo: it.estoque.livro.titulo,
            }
          : null;

        return {
          ...it,
          preco_unitario: precoNumber,
          preco_unitario_cents: preco_cents,
          estoque: it.estoque ? { ...it.estoque, livro } : it.estoque,
        };
      });
    }

    // compute valor_total dynamically from itens if not provided
    if (cloned.itens && cloned.itens.length > 0) {
      const total = cloned.itens.reduce((acc: number, it: any) => {
        const price = Number(it.preco_unitario ?? 0);
        const qty = Number(it.quantidade ?? 0);
        return acc + price * qty;
      }, 0);
      cloned.valor_total = total;
      cloned.valor_total_cents = Math.round(total * 100);
    }

    // normalize pagamento.valor_pago if exists
    if (cloned.pagamento && cloned.pagamento.valor_pago != null) {
      const v = cloned.pagamento.valor_pago;
      cloned.pagamento.valor_pago = typeof v === 'object' && typeof v.toNumber === 'function' ? v.toNumber() : Number(v);
    }

      cloned.status_pedido_label = mapOrderStatusToLabel(cloned.status_pedido);


    return cloned;
  }

  async updateOrderStatusByExternalReference(externalReference: string, paymentStatus: string) {
    try {
      // Mapear status do Mercado Pago para status do sistema
      let orderStatus: string;
      
      switch (paymentStatus) {
        case 'approved':
          orderStatus = 'PAGAMENTO_APROVADO';
          break;
        case 'pending':
          orderStatus = 'PAGAMENTO_PENDENTE';
          break;
        case 'rejected':
        case 'cancelled':
          orderStatus = 'PAGAMENTO_REJEITADO';
          break;
        case 'refunded':
          orderStatus = 'PAGAMENTO_ESTORNADO';
          break;
        default:
          orderStatus = 'PAGAMENTO_DESCONHECIDO';
      }

      return await this.orderRepository.updateOrderStatusByExternalReference(externalReference, orderStatus);
    } catch (err: any) {
      throw new BadRequestException(`Erro ao atualizar status do pedido: ${err.message}`);
    }
  }

  async getOrderStatusByExternalReference(externalReference: string, userId?: number) {
    try {
      return await this.orderRepository.getOrderStatusByExternalReference(externalReference, userId);
    } catch (err: any) {
      throw new BadRequestException(`Erro ao buscar status do pedido: ${err.message}`);
    }
  }
}
