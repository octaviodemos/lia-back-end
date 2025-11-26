import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondOfferDto {
  @ApiProperty({ example: 'aceito' })
  @IsOptional()
  @IsString()
  status_oferta?: string;

  @ApiProperty({ example: 'Oferta aceita. Aguarde contato.' })
  @IsOptional()
  @IsString()
  resposta_admin?: string;
}