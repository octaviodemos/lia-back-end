import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UserDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id_usuario!: number;

  @ApiProperty({ example: 'Fulano' })
  @Expose()
  nome!: string;

  @ApiProperty({ example: 'fulano@example.com' })
  @Expose()
  email!: string;

  @ApiProperty({ example: '+5511999999999', required: false })
  @Expose()
  telefone?: string | null;

  @ApiProperty({ example: 'customer' })
  @Expose()
  tipo_usuario!: string;

  @ApiProperty({ type: String })
  @Expose()
  created_at!: Date;
}
