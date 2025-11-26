import { Module } from '@nestjs/common';
import { AddressesRepository } from './addresses.repository';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AddressesRepository, AddressesService],
  controllers: [AddressesController],
})
export class AddressesModule {}