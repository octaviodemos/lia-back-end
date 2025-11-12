import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookDto } from './dto/book.dto';
import { BookDetailDto } from './dto/book-detail.dto';

@Controller('books')
@ApiTags('Books')
@ApiBearerAuth('JWT')
export class BookController {
  constructor(private service: BookService) {}

  @Get()
  @ApiOperation({ summary: 'List all books' })
  @ApiResponse({ status: 200, description: 'List of books', type: [BookDto] })
  async findAll() {
    try {
      return await this.service.findAll();
    } catch (error: any) {
      throw new HttpException('Erro ao buscar livros.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by id' })
  @ApiResponse({ status: 200, description: 'Book detail with stock info', type: () => BookDetailDto })
  async findById(@Param('id') id: string) {
    try {
      const book = await this.service.findById(Number(id));
      return book;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erro ao buscar livro.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new book (admin)' })
  @ApiResponse({ status: 201, description: 'Book created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async create(@Body() body: CreateBookDto) {
    try {
      return await this.service.create(body as any);
    } catch (error: any) {
      try {
        console.error('[ERROR] BookController.create', error);
      } catch (e) {
      }
      
      if (error?.code === 'P2002' || (error.message && error.message.includes('ISBN'))) {
        const msg = error.message || 'Conflito de dados (campo único).';
        throw new HttpException(msg, HttpStatus.CONFLICT);
      }

      const msg = error && error.message ? error.message : 'Erro ao criar livro';
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }
}