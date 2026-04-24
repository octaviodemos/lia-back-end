import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StockDto } from './dto/stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('stock')
@ApiTags('Stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth('JWT')
export class StockController {
  constructor(private service: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Listar itens de estoque' })
  @ApiResponse({ status: 200, description: 'Itens de estoque com dados do livro' })
  async list() {
    return this.service.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create a stock item' })
  @ApiResponse({ status: 201, description: 'Stock item created', type: StockDto })
  async create(@Body() body: CreateStockDto) {
    return this.service.create(body as any);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar preço, disponibilidade ou nota (livro) de um item' })
  @ApiResponse({ status: 200, description: 'Item atualizado' })
  async update(@Param('id') id: string, @Body() body: UpdateStockItemDto) {
    return this.service.updateItem(parseInt(id, 10), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir item de estoque' })
  @ApiResponse({ status: 200, description: 'Item removido' })
  async remove(@Param('id') id: string) {
    return this.service.remove(parseInt(id, 10));
  }
}