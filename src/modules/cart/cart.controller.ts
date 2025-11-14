import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

@Controller('cart')
@ApiTags('Cart')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
  constructor(private service: CartService) {}

  @Post('items')
  @ApiOperation({ summary: 'Add an item to the authenticated user\'s cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  async addItem(@Body() body: AddItemDto, @CurrentUser('id') id_usuario: number) {
    return this.service.addItem({ id_usuario, id_estoque: body.id_estoque, quantidade: body.quantidade });
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user\'s cart' })
  @ApiResponse({ status: 200, description: 'Cart contents' })
  async getCart(@CurrentUser('id') id_usuario: number) {
    return this.service.getCart(id_usuario);
  }
}
