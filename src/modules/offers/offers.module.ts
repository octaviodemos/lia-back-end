import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { OffersRepository } from './offers.repository';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { createImageDiskStorage, imageFileFilter } from '@/shared/storage/multer-image-disk';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: createImageDiskStorage('offers'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024, files: 25 },
    }),
  ],
  providers: [OffersRepository, OffersService],
  controllers: [OffersController],
  exports: [OffersService, OffersRepository],
})
export class OffersModule {}