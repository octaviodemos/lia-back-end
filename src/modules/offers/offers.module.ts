import { Module } from '@nestjs/common';
import { OffersRepository } from './offers.repository';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OffersRepository, OffersService],
  controllers: [OffersController],
})
export class OffersModule {}