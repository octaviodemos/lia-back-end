import { ApiProperty } from '@nestjs/swagger';

export class BookDto {
  @ApiProperty({ example: 1 })
  id_livro!: number;

  @ApiProperty({ example: 'O Senhor dos Anéis' })
  titulo!: string;

  @ApiProperty({ example: 'Sinopse...', required: false })
  sinopse?: string;

  @ApiProperty({ example: 'Editora XYZ', required: false })
  editora?: string;

  @ApiProperty({ example: 1954, required: false })
  ano_publicacao?: number;

  @ApiProperty({ example: '978-xxx', required: false })
  isbn?: string;

  @ApiProperty({ example: 'https://...', required: false })
  capa_url?: string;

  @ApiProperty({ type: String })
  created_at!: Date;
}
