import { Controller, Get, Param, UseGuards, Delete, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BookService } from './book.service';

@Controller('admin/avaliacoes')
@ApiTags('AdminReviews')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminReviewsController {
  constructor(private service: BookService) {}

  @Get('pending')
  @Roles('admin')
  @ApiOperation({ summary: 'List pending reviews (admin)' })
  async listPending() {
    return this.service.getPendingReviews();
  }

  @Post(':id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve a review' })
  async approve(@Param('id') id: string) {
    return this.service.approveReview(Number(id));
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Reject (delete) a review' })
  async reject(@Param('id') id: string) {
    return this.service.rejectReview(Number(id));
  }
}

