import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  id_livro!: number;

  @ApiProperty({ example: '49.90', description: 'Preço como string com 2 casas decimais, ex: "49.90"' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'preco deve ser uma string numérica com até 2 casas decimais, ex: "49.90"' })
  preco!: string;

  @ApiProperty({ example: 5, description: 'Nota de conservação 1 a 5 (vinculada ao livro no catálogo)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  nota_conservacao!: number;

  @ApiPropertyOptional({ example: 'novo' })
  @IsOptional()
  @IsString()
  condicao?: string;
}
