import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { CartModule } from './modules/cart/cart.module';
import { StockModule } from './modules/stock/stock.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, BooksModule, CartModule, StockModule],
})
export class AppModule {}
