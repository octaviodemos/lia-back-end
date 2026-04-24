import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '(48) 99999-0000' })
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[\d\s()\-+.]*$/, { message: 'telefone contém caracteres inválidos' })
  telefone?: string;
}
