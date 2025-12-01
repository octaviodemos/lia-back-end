import { Controller, Get, Query, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrderService } from './order.service';

@Controller('admin/orders')
@ApiTags('AdminOrders')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminOrdersController {
  constructor(private service: OrderService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all orders (admin) with pagination and filters' })
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

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Update order status (admin)' })
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const status = body?.status;
    return this.service.updateStatusById(Number(id), status);
  }
}
