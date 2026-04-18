import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @ApiProperty({ example: 'O Senhor dos Anéis' })
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @ApiProperty({ example: 'Sinopse...', required: false })
  @IsOptional()
  @IsString()
  sinopse?: string;

  @ApiProperty({ example: 'Editora XYZ', required: false })
  @IsOptional()
  @IsString()
  editora?: string;

  @ApiProperty({ example: 1954, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ano_publicacao?: number;

  @ApiProperty({ example: '978-xxx', required: false })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiProperty({ example: 5, description: 'Nota de 1 a 5 (estado físico do exemplar)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  nota_conservacao!: number;

  @ApiProperty({ example: 'Leves marcas na lombada', required: false })
  @IsOptional()
  @IsString()
  descricao_conservacao?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  destaque_vitrine?: boolean;
}
