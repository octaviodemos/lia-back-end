import { Controller, Get, Post, Patch, Param, UseGuards, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['descricao_problema'],
      properties: {
        descricao_problema: { type: 'string' },
        fotos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        imagem_Capa: { type: 'string', format: 'binary' },
        imagem_Contracapa: { type: 'string', format: 'binary' },
        imagem_Lombada: { type: 'string', format: 'binary' },
        imagem_MioloPaginas: { type: 'string', format: 'binary' },
        imagem_DetalhesAvarias: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(AnyFilesInterceptor())
  async createRequest(
    @CurrentUser('id') id_usuario: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateRepairDto,
  ) {
    return this.service.createRequest(id_usuario, dto as any, files || []);
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
