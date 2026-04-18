import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class AddItemDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  id_estoque!: number;
}
