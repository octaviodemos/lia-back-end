import { Controller, Post, Get, Param, Body, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PublicationService } from './publication.service';
import { CreatePublicationCommentDto } from './dto/create-publication-comment.dto';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

@Controller('publicacoes')
@ApiTags('Publications')
export class PublicationController {
  constructor(private service: PublicationService) {}

  @Post(':id/comentarios')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create comment on a publication (auth)' })
  async createComment(@Param('id') id: string, @CurrentUser('id') id_usuario: number, @Body() dto: CreatePublicationCommentDto) {
    return this.service.createComment(Number(id), id_usuario, dto.conteudo);
  }

  @Get(':id/comentarios')
  @ApiOperation({ summary: 'Get approved comments for a publication' })
  async getComments(@Param('id') id: string) {
    return this.service.getApprovedComments(Number(id));
  }
}

@Controller('admin/publicacoes/comentarios')
@ApiTags('AdminPublicationsComments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class AdminPublicationCommentsController {
  constructor(private service: PublicationService) {}

  @Get('pending')
  @Roles('admin')
  @ApiOperation({ summary: 'List pending publication comments (admin)' })
  async listPending() {
    return this.service.getPendingComments();
  }

  @Post(':id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve a publication comment' })
  async approve(@Param('id') id: string) {
    return this.service.approveComment(Number(id));
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Reject (delete) a publication comment' })
  async reject(@Param('id') id: string) {
    return this.service.rejectComment(Number(id));
  }
}
