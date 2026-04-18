import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BookRepository } from './book.repository';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { AdminReviewsController } from './admin-reviews.controller';
import { createImageDiskStorage, imageFileFilter } from '@/shared/storage/multer-image-disk';

@Module({
  imports: [
    MulterModule.register({
      storage: createImageDiskStorage('books'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024, files: 25 },
    }),
  ],
  controllers: [BookController, AdminReviewsController],
  providers: [BookService, BookRepository],
  exports: [BookService],
})
export class BooksModule {}
