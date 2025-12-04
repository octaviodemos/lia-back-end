import { Module } from '@nestjs/common';
import { BookRepository } from './book.repository';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { AdminReviewsController } from './admin-reviews.controller';
import { AvaliacaoReactionsController } from './reactions.controller';

@Module({
  controllers: [BookController, AdminReviewsController, AvaliacaoReactionsController],
  providers: [BookService, BookRepository],
  exports: [BookService],
})
export class BooksModule {}
