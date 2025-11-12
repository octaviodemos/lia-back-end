import { Module } from '@nestjs/common';
import { BookRepository } from './book.repository';
import { BookService } from './book.service';
import { BookController } from './book.controller';

@Module({
  controllers: [BookController],
  providers: [BookService, BookRepository],
  exports: [BookService],
})
export class BooksModule {}
