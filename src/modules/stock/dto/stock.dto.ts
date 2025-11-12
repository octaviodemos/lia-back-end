import { ApiProperty } from '@nestjs/swagger';

export class StockDto {
  @ApiProperty({ example: 1 })
  id_estoque!: number;

  @ApiProperty({ example: 1 })
  id_livro!: number;

  @ApiProperty({ example: 10 })
  quantidade!: number;

  @ApiProperty({ example: 49.9 })
  preco!: number;

  @ApiProperty({ example: 'novo', required: false })
  condicao?: string;

  @ApiProperty({ type: String })
  created_at!: Date;
}
