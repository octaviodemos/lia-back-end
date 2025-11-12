import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddItemDto {
  @ApiProperty({ example: 123 })
  @IsInt()
  id_estoque!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantidade!: number;
}
