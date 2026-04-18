import { Controller, Get, Post, Patch, Param, UseGuards, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

@Controller('offers')
@ApiTags('Offers')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private service: OffersService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['titulo_livro', 'condicao_livro', 'preco_sugerido'],
      properties: {
        titulo_livro: { type: 'string' },
        autor_livro: { type: 'string' },
        isbn: { type: 'string' },
        condicao_livro: { type: 'string' },
        preco_sugerido: { type: 'number' },
        imagem_Capa: { type: 'string', format: 'binary' },
        imagem_Contracapa: { type: 'string', format: 'binary' },
        imagem_Lombada: { type: 'string', format: 'binary' },
        imagem_MioloPaginas: { type: 'string', format: 'binary' },
        imagem_DetalhesAvarias: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Create book sell offer' })
  async createOffer(
    @CurrentUser('id') id_usuario: number,
    @Body() dto: CreateOfferDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.service.createOffer(id_usuario, dto, files || []);
  }

  @Get('my-offers')
  @ApiOperation({ summary: 'Get user offers' })
  async getMyOffers(@CurrentUser('id') id_usuario: number) {
    return this.service.getMyOffers(id_usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Get all offers (admin)' })
  async getAllOffers() {
    return this.service.getAllOffers();
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Respond to offer (admin)' })
  async respondToOffer(@Param('id') id: string, @Body() dto: RespondOfferDto) {
    return this.service.respondToOffer(+id, dto);
  }
}
