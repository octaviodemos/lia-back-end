import { OmitType } from '@nestjs/swagger';
import { StockDto } from './stock.dto';

export class CreateStockDto extends OmitType(StockDto, ['id_estoque', 'created_at'] as const) {}
