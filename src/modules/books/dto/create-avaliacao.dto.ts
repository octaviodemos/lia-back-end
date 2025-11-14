import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvaliacaoDto {
  @ApiProperty({ example: 5, description: 'Nota de 1 a 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  nota!: number;

  @ApiProperty({ example: 'Ótimo livro', required: false })
  @IsOptional()
  @IsString()
  comentario?: string;
}
