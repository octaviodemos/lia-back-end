import { Controller, Post, Param, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OffersRepository } from '../offers/offers.repository';
import { RepairsRepository } from '../repairs/repairs.repository';
import { AiService } from './ai.service';
import { TipoImagem } from '@prisma/client';

const ROTULO_TIPO_IMAGEM: Record<TipoImagem, string> = {
  [TipoImagem.Capa]: 'Capa',
  [TipoImagem.Contracapa]: 'Contracapa',
  [TipoImagem.Lombada]: 'Lombada',
  [TipoImagem.MioloPaginas]: 'Miolo',
  [TipoImagem.DetalhesAvarias]: 'Avarias',
};

@ApiTags('AI')
@Controller('ai')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AiController {
  constructor(
    private readonly offersRepository: OffersRepository,
    private readonly repairsRepository: RepairsRepository,
    private readonly aiService: AiService,
  ) {}

  @Post('evaluate-offer/:id')
  @ApiOperation({ summary: 'Avaliar conservação do livro (IA) a partir das fotos da oferta' })
  async evaluateOffer(@Param('id') id: string) {
    const idOferta = parseInt(id, 10);
    if (Number.isNaN(idOferta)) {
      throw new BadRequestException('Identificador de oferta inválido.');
    }

    const oferta = await this.offersRepository.findByIdWithImagens(idOferta);
    if (!oferta) {
      throw new NotFoundException('Oferta não encontrada.');
    }

    const imagens = oferta.imagens || [];
    if (!imagens.length) {
      throw new BadRequestException('Esta oferta não possui imagens para avaliação.');
    }

    const imagePaths = imagens.map((img) => {
      const rel = img.url_imagem.startsWith('/') ? img.url_imagem.slice(1) : img.url_imagem;
      const absolutePath = path.resolve(process.cwd(), rel);
      return {
        path: absolutePath,
        type: ROTULO_TIPO_IMAGEM[img.tipo_imagem] ?? String(img.tipo_imagem),
      };
    });

    return this.aiService.evaluateBookCondition(imagePaths);
  }

  @Post('evaluate-reform/:id')
  @ApiOperation({ summary: 'Avaliar solicitação de reforma (mock) a partir das fotos' })
  async evaluateReform(@Param('id') id: string) {
    const idSolicitacao = parseInt(id, 10);
    if (Number.isNaN(idSolicitacao)) {
      throw new BadRequestException('Identificador de solicitação inválido.');
    }

    const solicitacao = await this.repairsRepository.findByIdWithFotos(idSolicitacao);
    if (!solicitacao) {
      throw new NotFoundException('Solicitação de reforma não encontrada.');
    }

    const fotos = solicitacao.fotos || [];
    if (!fotos.length) {
      throw new BadRequestException('Esta solicitação não possui fotos para avaliação.');
    }

    const imagePaths = fotos.map((foto) => {
      const raw = foto.url_foto || '';
      const rel = raw.startsWith('/') ? raw.slice(1) : raw;
      const absolutePath = path.resolve(process.cwd(), rel);
      return {
        path: absolutePath,
        type: ROTULO_TIPO_IMAGEM[foto.tipo_imagem] ?? String(foto.tipo_imagem),
      };
    });

    return this.aiService.evaluateReform(imagePaths);
  }
}
