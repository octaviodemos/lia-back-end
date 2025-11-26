import { IsString, IsOptional } from 'class-validator';
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
  cep!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  cidade!: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  estado!: string;
}