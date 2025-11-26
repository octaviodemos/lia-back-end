import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondRepairDto {
  @ApiProperty({ example: 'em_andamento' })
  @IsOptional()
  @IsString()
  status_solicitacao?: string;
}