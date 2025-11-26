import { Controller, Get, Post, Patch, Param, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create book sell offer' })
  async createOffer(@CurrentUser('id') id_usuario: number, @Body() dto: CreateOfferDto) {
    return this.service.createOffer(id_usuario, dto);
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