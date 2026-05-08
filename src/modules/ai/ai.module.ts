import { Module } from '@nestjs/common';
import { OffersModule } from '../offers/offers.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [OffersModule],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
