import { Controller, Get, Post, UseGuards, Body, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderService } from './order.service';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { CartRepository } from '@/modules/cart/cart.repository';

@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private service: OrderService, private cartRepository: CartRepository) {}

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm payment and finalize the order from the user cart' })
  async confirm(@CurrentUser('id') id_usuario: number, @Body() body: ConfirmOrderDto) {
    const pedido = await this.service.finalizeOrderFromCart(id_usuario, body);
    return { success: true, id_pedido: pedido.id_pedido };
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get user orders' })
  async getMyOrders(@CurrentUser('id') id_usuario: number) {
    return await this.service.getMyOrders(id_usuario);
  }

  // Dev helper: create cart with provided items and immediately finalize the order.
  // This endpoint is ONLY available when NODE_ENV !== 'production'.
  @Post('confirm-test')
  @ApiOperation({ summary: 'DEV: fill cart and confirm order (dev only)' })
  async confirmTest(@Body() body: any) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException();
    }

    const id_usuario: number = body?.id_usuario;
    const items: Array<{ id_estoque: number; quantidade: number }> = body?.items;
    const paymentPayload = body?.paymentPayload ?? body;

    if (!id_usuario || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Expected body: { id_usuario, items: [{id_estoque, quantidade}], paymentPayload? }');
    }

    // Ensure cart exists
    const cart = await this.cartRepository.findOrCreateByUserId(id_usuario);

    // Add items to cart (overwrite/create)
    for (const it of items) {
      const existing = await this.cartRepository.findItemInCart(cart.id_carrinho, it.id_estoque);
      if (existing) {
        await this.cartRepository.updateItemQuantity(existing.id_carrinho_item, it.quantidade);
      } else {
        await this.cartRepository.addItem(cart.id_carrinho, it.id_estoque, it.quantidade);
      }
    }

    // Finalize order (will decrement stock atomically)
    const pedido = await this.service.finalizeOrderFromCart(id_usuario, paymentPayload);
    return { success: true, id_pedido: pedido.id_pedido };
  }
}
