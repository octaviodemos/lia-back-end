import { Module } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { CartRepository } from '@/modules/cart/cart.repository';

@Module({
  imports: [PrismaModule],
  providers: [OrderRepository, OrderService, CartRepository],
  controllers: [OrderController, AdminOrdersController],
  exports: [OrderService, OrderRepository],
})
export class OrdersModule {}
