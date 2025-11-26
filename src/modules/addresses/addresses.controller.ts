import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

@Controller('addresses')
@ApiTags('Addresses')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private service: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user addresses' })
  async getAddresses(@CurrentUser('id') id_usuario: number) {
    return this.service.getAddresses(id_usuario);
  }

  @Post()
  @ApiOperation({ summary: 'Add new address' })
  async addAddress(@CurrentUser('id') id_usuario: number, @Body() dto: CreateAddressDto) {
    return this.service.addAddress(id_usuario, dto);
  }
}