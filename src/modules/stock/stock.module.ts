import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockRepository } from './stock.repository';
import { BookRepository } from '@/modules/books/book.repository';
import { StockController } from './stock.controller';

@Module({
  controllers: [StockController],
  providers: [StockService, StockRepository, BookRepository],
  exports: [StockService],
})
export class StockModule {}
