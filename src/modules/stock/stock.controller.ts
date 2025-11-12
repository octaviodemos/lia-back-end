import { Controller, Post, Body, Patch, Param } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StockDto } from './dto/stock.dto';

@Controller('stock')
@ApiTags('Stock')
export class StockController {
  constructor(private service: StockService) {}

  @Post()
  @ApiOperation({ summary: 'Create a stock item' })
  @ApiResponse({ status: 201, description: 'Stock item created', type: StockDto })
  async create(@Body() body: CreateStockDto) {
    return this.service.create(body as any);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a stock item' })
  @ApiResponse({ status: 200, description: 'Stock item updated', type: StockDto })
  async update(@Param('id') id: string, @Body() body: UpdateStockDto) {
    return this.service.update(parseInt(id, 10), body as any);
  }
}