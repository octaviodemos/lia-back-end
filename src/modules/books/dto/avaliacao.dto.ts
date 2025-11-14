import { ApiProperty } from '@nestjs/swagger';

export class AvaliacaoDto {
  @ApiProperty({ example: 1 })
  id_avaliacao!: number;

  @ApiProperty({ example: 1 })
  id_livro!: number;

  @ApiProperty({ example: 2 })
  id_usuario!: number;

  @ApiProperty({ example: 5 })
  nota!: number;

  @ApiProperty({ example: 'Muito bom', required: false })
  comentario?: string;

  @ApiProperty({ example: '2025-11-14T12:00:00Z' })
  data_avaliacao!: Date;

  @ApiProperty({ required: false })
  usuario?: { id_usuario: number; nome: string };
}
