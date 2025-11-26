import { Controller, Get, Post, Patch, Param, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RepairsService } from './repairs.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RespondRepairDto } from './dto/respond-repair.dto';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

@Controller('repairs')
@ApiTags('Repairs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class RepairsController {
  constructor(private service: RepairsService) {}

  @Post()
  @ApiOperation({ summary: 'Create repair request' })
  async createRequest(@CurrentUser('id') id_usuario: number, @Body() dto: CreateRepairDto) {
    return this.service.createRequest(id_usuario, dto);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get user repair requests' })
  async getMyRequests(@CurrentUser('id') id_usuario: number) {
    return this.service.getMyRequests(id_usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Get all repair requests (admin)' })
  async getAllRequests() {
    return this.service.getAllRequests();
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Respond to repair request (admin)' })
  async respondToRequest(@Param('id') id: string, @Body() dto: RespondRepairDto) {
    return this.service.respondToRequest(+id, dto);
  }
}