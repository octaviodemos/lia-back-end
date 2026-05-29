import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
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
    const resultado = await this.aiService.identifyBookFromCover({
      buffer: file.buffer,
      mimeType: file.mimetype,
    });
    if (!resultado.titulo?.trim() && !resultado.autor?.trim() && !resultado.isbn?.trim()) {
      throw new ServiceUnavailableException(
        'Não foi possível identificar título ou autor na capa. Tente outra foto ou preencha manualmente.',
      );
    }
    return resultado;
  }
}
