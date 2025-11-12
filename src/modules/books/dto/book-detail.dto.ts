import { ApiProperty } from '@nestjs/swagger';
import { BookDto } from './book.dto';
import { StockDto } from '@/modules/stock/dto/stock.dto';

export class BookDetailDto extends BookDto {
  @ApiProperty({ type: () => [StockDto], description: 'Entradas de estoque para este livro' })
  estoque!: StockDto[];
}
