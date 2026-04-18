import { ApiProperty } from '@nestjs/swagger';
import { BookDto, LivroImagemDto } from './book.dto';
import { StockDto } from '@/modules/stock/dto/stock.dto';

export class OutraOpcaoVitrineDto {
  @ApiProperty({ example: 2 })
  id_livro!: number;

  @ApiProperty({ example: 4 })
  nota_conservacao!: number;

  @ApiProperty({ example: 'Miolo levemente amarelado', required: false })
  descricao_conservacao?: string | null;

  @ApiProperty({ type: () => [LivroImagemDto] })
  imagens!: LivroImagemDto[];

  @ApiProperty({ example: '39.90', required: false })
  preco?: string | null;

  @ApiProperty({ example: 10, required: false })
  id_estoque?: number | null;

  @ApiProperty({ example: 'usado', required: false })
  condicao?: string | null;
}

export class BookDetailDto extends BookDto {
  @ApiProperty({ type: () => [StockDto], description: 'Entradas de estoque para este livro' })
  estoque!: StockDto[];

  @ApiProperty({ type: () => [OutraOpcaoVitrineDto], description: 'Outros exemplares com o mesmo ISBN à venda' })
  outras_opcoes!: OutraOpcaoVitrineDto[];
}
