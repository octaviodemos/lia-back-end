import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ example: 'O Senhor dos Anéis' })
  @IsString()
  titulo_livro!: string;

  @ApiProperty({ example: 'J. R. R. Tolkien', required: false })
  @IsOptional()
  @IsString()
  autor_livro?: string;

  @ApiProperty({ example: '978-0547928227', required: false })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiProperty({ example: 'Livro em bom estado, capa original' })
  @IsString()
  condicao_livro!: string;

  @ApiProperty({ example: 45.90 })
  @IsNumber()
  preco_sugerido!: number;
}