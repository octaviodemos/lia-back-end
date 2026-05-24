import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class AiCoverController {
  constructor(private readonly aiService: AiService) {}

  @Post('identify-cover')
  @UseInterceptors(FileInterceptor('capa'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['capa'],
      properties: {
        capa: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Identificar título e autor a partir da foto da capa (IA)' })
  async identifyCover(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Envie uma imagem da capa do livro.');
    }
    if (!/^image\//.test(file.mimetype || '')) {
      throw new BadRequestException('O arquivo deve ser uma imagem.');
    }
    return this.aiService.identifyBookFromCover({
      buffer: file.buffer,
      mimeType: file.mimetype,
    });
  }
}
