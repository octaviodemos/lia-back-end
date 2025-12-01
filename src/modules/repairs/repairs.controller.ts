import { Controller, Get, Post, Patch, Param, UseGuards, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RepairsService } from './repairs.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { RespondRepairDto } from './dto/respond-repair.dto';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('repairs')
@ApiTags('Repairs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class RepairsController {
  constructor(private service: RepairsService) {}

  @Post()
  @ApiOperation({ summary: 'Create repair request' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        descricao_problema: { type: 'string' },
        fotos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('fotos', 5))
  async createRequest(
    @CurrentUser('id') id_usuario: number,
    @UploadedFiles() fotos: Express.Multer.File[],
    @Body() dto: CreateRepairDto,
  ) {
    return this.service.createRequest(id_usuario, dto as any, fotos || []);
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
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Respond to repair request (admin)' })
  async respondToRequest(@Param('id') id: string, @Body() body: any) {
    const dto: RespondRepairDto = {
      status_solicitacao: body.status_solicitacao ?? body.status,
    };
    return this.service.respondToRequest(+id, dto);
  }
}