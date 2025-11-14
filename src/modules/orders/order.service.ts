import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderRepository } from './order.repository';

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
}
