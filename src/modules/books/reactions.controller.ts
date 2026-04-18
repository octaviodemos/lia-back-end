import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookService } from './book.service';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

@Controller('avaliacoes')
@ApiTags('AvaliacaoReactions')
export class AvaliacaoReactionsController {
  constructor(private service: BookService) {}

  @Get(':id/reactions')
  @ApiOperation({ summary: 'Get likes/dislikes for an avaliacao (optional auth for userReaction)' })
  async get(@Param('id') id: string, @CurrentUser('id') id_usuario?: number) {
    return this.service.getReactionsForReview(Number(id), id_usuario);
  }

  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Toggle/set reaction (LIKE|DISLIKE) for an avaliacao' })
  async post(@Param('id') id: string, @CurrentUser('id') id_usuario: number, @Body() body: { type: 'LIKE' | 'DISLIKE' }) {
    return this.service.postReactionForReview(Number(id), id_usuario, body.type);
  }

  @Delete(':id/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Remove reaction for the current user from avaliacao' })
  async delete(@Param('id') id: string, @CurrentUser('id') id_usuario: number) {
    return this.service.deleteReactionForReview(Number(id), id_usuario);
  }
}
