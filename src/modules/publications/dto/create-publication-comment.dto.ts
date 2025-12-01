import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePublicationCommentDto {
  @ApiProperty({ example: 'Muito bom!' })
  @IsString()
  conteudo!: string;
}
