import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRepairDto {
  @ApiProperty({ example: 'Páginas soltas, lombada danificada' })
  @IsString()
  descricao_problema!: string;
}