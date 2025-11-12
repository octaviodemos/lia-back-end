import { OmitType } from '@nestjs/swagger';
import { BookDto } from './book.dto';

export class CreateBookDto extends OmitType(BookDto, ['id_livro', 'created_at'] as const) {}
