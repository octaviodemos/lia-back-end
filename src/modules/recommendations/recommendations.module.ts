import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@/prisma/prisma.module';
import { BooksModule } from '../books/books.module';
import { AiModule } from '../ai/ai.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { SkoobService } from './skoob.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 15000 }),
    PrismaModule,
    BooksModule,
    AiModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, SkoobService],
})
export class RecommendationsModule {}
