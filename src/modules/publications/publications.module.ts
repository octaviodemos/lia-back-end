import { Module } from '@nestjs/common';
import { PublicationRepository } from './publication.repository';
import { PublicationService } from './publication.service';
import { PublicationController, AdminPublicationCommentsController } from './publication.controller';

@Module({
  imports: [],
  controllers: [PublicationController, AdminPublicationCommentsController],
  providers: [PublicationService, PublicationRepository],
  exports: [PublicationService],
})
export class PublicationsModule {}
