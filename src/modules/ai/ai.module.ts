import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OffersModule } from '../offers/offers.module';
import { RepairsModule } from '../repairs/repairs.module';
import { imageFileFilter } from '@/shared/storage/multer-image-disk';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiCoverController } from './ai-cover.controller';

@Module({
  imports: [
    OffersModule,
    RepairsModule,
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  ],
  providers: [AiService],
  controllers: [AiController, AiCoverController],
  exports: [AiService],
})
export class AiModule {}
