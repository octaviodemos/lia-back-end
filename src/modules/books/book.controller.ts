import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { BookDto } from './dto/book.dto';
import { BookDetailDto } from './dto/book-detail.dto';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { AvaliacaoDto } from './dto/avaliacao.dto';

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

  @Get(':id/avaliacoes')
  @ApiOperation({ summary: 'List reviews for a book' })
  @ApiResponse({ status: 200, description: 'List of reviews', type: () => [AvaliacaoDto] })
  async getReviews(@Param('id') id: string, @Req() req: any) {
    try {
      const user = req.user as any;
      const userId = user?.id_usuario || user?.sub || user?.id;
      return await this.service.getReviewsWithUser(Number(id), userId);
    } catch (error: any) {
      throw new HttpException('Erro ao buscar avaliações.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/avaliacoes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a review for a book (authenticated)' })
  @ApiResponse({ status: 201, description: 'Review created', type: () => AvaliacaoDto })
  async createReview(@Param('id') id: string, @Body() body: CreateAvaliacaoDto, @Req() req: any) {
    try {
      const user = req.user as any;
      return await this.service.createReview(Number(id), user?.id_usuario || user?.sub || user?.id, body);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Erro ao criar avaliação.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        sinopse: { type: 'string' },
        editora: { type: 'string' },
        ano_publicacao: { type: 'integer' },
        isbn: { type: 'string' },
        nota_conservacao: { type: 'integer', minimum: 1, maximum: 5 },
        descricao_conservacao: { type: 'string' },
        destaque_vitrine: { type: 'boolean' },
        imagem_Capa: { type: 'string', format: 'binary' },
        imagem_Contracapa: { type: 'string', format: 'binary' },
        imagem_Lombada: { type: 'string', format: 'binary' },
        imagem_MioloPaginas: { type: 'string', format: 'binary' },
        imagem_DetalhesAvarias: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Update book (admin)' })
  @ApiResponse({ status: 200, description: 'Book updated' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBookDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      return await this.service.update(Number(id), body, files || []);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error?.code === 'P2002') {
        throw new HttpException(error.message || 'Conflito de dados (campo único).', HttpStatus.CONFLICT);
      }
      const msg = error && error.message ? error.message : 'Erro ao atualizar livro';
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
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
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['titulo', 'nota_conservacao'],
      properties: {
        titulo: { type: 'string' },
        sinopse: { type: 'string' },
        editora: { type: 'string' },
        ano_publicacao: { type: 'integer' },
        isbn: { type: 'string' },
        nota_conservacao: { type: 'integer', minimum: 1, maximum: 5 },
        descricao_conservacao: { type: 'string' },
        destaque_vitrine: { type: 'boolean' },
        preco: { type: 'string' },
        imagem_Capa: { type: 'string', format: 'binary' },
        imagem_Contracapa: { type: 'string', format: 'binary' },
        imagem_Lombada: { type: 'string', format: 'binary' },
        imagem_MioloPaginas: { type: 'string', format: 'binary' },
        imagem_DetalhesAvarias: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Create a new book (admin)' })
  @ApiResponse({ status: 201, description: 'Book created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async create(@Body() body: CreateBookDto, @UploadedFiles() files: Express.Multer.File[]) {
    try {
      return await this.service.create(body, files || []);
    } catch (error: any) {
      if (error?.code === 'P2002' || (error.message && error.message.includes('ISBN'))) {
        const msg = error.message || 'Conflito de dados (campo único).';
        throw new HttpException(msg, HttpStatus.CONFLICT);
      }

      const msg = error && error.message ? error.message : 'Erro ao criar livro';
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }
}
