import { Module } from '@nestjs/common';
import { BookRepository } from './book.repository';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { AdminReviewsController } from './admin-reviews.controller';

@Module({
  controllers: [BookController, AdminReviewsController],
  providers: [BookService, BookRepository],
  exports: [BookService],
})
export class BooksModule {}
