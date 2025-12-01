import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController, AdminRequestsController } from './requests.controller';
import { OffersModule } from '../offers/offers.module';
import { RepairsModule } from '../repairs/repairs.module';

@Module({
  imports: [OffersModule, RepairsModule],
  providers: [RequestsService],
  controllers: [RequestsController, AdminRequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
