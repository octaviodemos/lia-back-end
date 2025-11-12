import { ApiProperty } from '@nestjs/swagger';

export class StockDto {
  @ApiProperty({ example: 1 })
  id_estoque!: number;

  @ApiProperty({ example: 1 })
  id_livro!: number;

  @ApiProperty({ example: 10 })
  quantidade!: number;

  @ApiProperty({ example: '49.90' })
  preco!: string;

  @ApiProperty({ example: 'novo', required: false })
  condicao?: string;

  @ApiProperty({ type: String, required: false })
  created_at?: Date;
}
