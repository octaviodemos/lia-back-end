import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { CartModule } from './modules/cart/cart.module';
import { StockModule } from './modules/stock/stock.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { OffersModule } from './modules/offers/offers.module';
import { RepairsModule } from './modules/repairs/repairs.module';
import { RequestsModule } from './modules/requests/requests.module';
import { UtilsModule } from './modules/utils/utils.module';
import { PaymentModule } from './modules/payments/payment.module';
import { PublicationsModule } from './modules/publications/publications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    SharedModule, 
    UsersModule, 
    AuthModule, 
    BooksModule, 
    CartModule, 
    StockModule, 
    OrdersModule,
    AddressesModule,
    OffersModule,
    RepairsModule,
    RequestsModule,
    PublicationsModule,
    UtilsModule,
    PaymentModule
  ],
})
export class AppModule {}
