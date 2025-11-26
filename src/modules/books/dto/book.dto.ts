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

  @ApiProperty({ example: [{ id_genero: 1, nome: 'Ficção' }], required: false })
  generos?: { id_genero: number; nome: string }[];

  @ApiProperty({ example: [{ id_autor: 1, nome_completo: 'J. R. R. Tolkien' }], required: false })
  autores?: { id_autor: number | null; nome_completo: string }[];

  @ApiProperty({ example: '49.90', required: false })
  preco?: string;

  @ApiProperty({ example: 1, required: false })
  id_estoque?: number;
}
