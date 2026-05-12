import { Module } from '@nestjs/common';
import { OffersModule } from '../offers/offers.module';
import { RepairsModule } from '../repairs/repairs.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [OffersModule, RepairsModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
