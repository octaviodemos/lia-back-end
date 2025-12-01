import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RepairsService } from './repairs.service';

@Controller('admin/repairs')
@ApiTags('AdminRepairs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminRepairsController {
  constructor(private service: RepairsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all repair requests (admin) with pagination and filters' })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
  ) {
    const p = Math.max(1, parseInt(page as any, 10) || 1);
    const l = Math.min(100, parseInt(limit as any, 10) || 20);
    return this.service.findAllAdmin({ page: p, limit: l, status, q, sort });
  }
}
