import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
@ApiTags('Recommendations')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get('skoob')
  @ApiOperation({ summary: 'Recomendações baseadas na estante Skoob (mock de IDs)' })
  async skoob(@CurrentUser('id') idUsuario: number) {
    return this.recommendations.getSkoobRecommendationsForUser(Number(idUsuario));
  }
}
