import { Controller, Get, UseGuards, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { RequestsService } from './requests.service';

@Controller('requests')
@ApiTags('Requests')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private service: RequestsService) {}

  @Get('my-requests')
  @ApiOperation({ summary: 'Get user offers and repair requests' })
  async myRequests(@CurrentUser('id') id_usuario: number) {
    return this.service.getMyRequests(id_usuario);
  }
}

@Controller('admin/requests')
@ApiTags('AdminRequests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class AdminRequestsController {
  constructor(private service: RequestsService) {}

  @Get('pending')
  @Roles('admin')
  @ApiOperation({ summary: 'Get pending offers and repairs for admin review' })
  async pending() {
    return this.service.getAdminPending();
  }

  @Patch('offers/:id/respond')
  @Roles('admin')
  @ApiOperation({ summary: 'Respond to offer (admin)' })
  async respondOffer(@Param('id') id: string, @Param() params: any) {
    // controller keeps signature minimal; callers should use existing Offers.dto
    return this.service.respondToOffer(Number(id), params.body || {});
  }

  @Patch('repairs/:id/respond')
  @Roles('admin')
  @ApiOperation({ summary: 'Respond to repair request (admin)' })
  async respondRepair(@Param('id') id: string, @Param() params: any) {
    return this.service.respondToRepair(Number(id), params.body || {});
  }
}
