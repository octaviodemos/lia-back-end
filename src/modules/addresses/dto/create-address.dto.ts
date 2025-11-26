import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  rua!: string;

  @ApiProperty({ example: '123' })
  @IsString()
  numero!: string;

  @ApiProperty({ example: 'Apto 45', required: false })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({ example: '01234-567' })
  @IsString()
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP deve ter formato 12345-678 ou 12345678' })
  cep!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  cidade!: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'Estado deve ser uma sigla de 2 letras maiúsculas (ex: SP)' })
  estado!: string;
}