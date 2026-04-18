import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { RepairsRepository } from './repairs.repository';
import { RepairsService } from './repairs.service';
import { RepairsController } from './repairs.controller';
import { AdminRepairsController } from './admin-repairs.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { createImageDiskStorage, imageFileFilter } from '@/shared/storage/multer-image-disk';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: createImageDiskStorage('repairs'),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024, files: 25 },
    }),
  ],
  providers: [RepairsRepository, RepairsService],
  controllers: [RepairsController, AdminRepairsController],
  exports: [RepairsService],
})
export class RepairsModule {}