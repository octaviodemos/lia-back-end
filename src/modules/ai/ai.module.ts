import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OffersModule } from '../offers/offers.module';
import { RepairsModule } from '../repairs/repairs.module';
import { imageFileFilter } from '@/shared/storage/multer-image-disk';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiCoverController } from './ai-cover.controller';
import { IsbnLookupService } from './isbn-lookup.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 8000 }),
    OffersModule,
    RepairsModule,
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  ],
  providers: [AiService, IsbnLookupService],
  controllers: [AiController, AiCoverController],
  exports: [AiService],
})
export class AiModule {}
