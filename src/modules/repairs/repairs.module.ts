import { Module } from '@nestjs/common';
import { RepairsRepository } from './repairs.repository';
import { RepairsService } from './repairs.service';
import { RepairsController } from './repairs.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RepairsRepository, RepairsService],
  controllers: [RepairsController],
})
export class RepairsModule {}