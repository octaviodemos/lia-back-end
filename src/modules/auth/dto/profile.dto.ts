import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({ example: 1 })
  id_usuario!: number;

  @ApiProperty({ example: 'João Silva' })
  nome!: string;

  @ApiProperty({ example: 'joao@email.com' })
  email!: string;

  @ApiProperty({ example: '+5511999999999', required: false })
  telefone?: string;

  @ApiProperty({ example: 'cliente', description: 'Tipo do usuário: cliente ou admin' })
  tipo_usuario!: string;

  @ApiProperty()
  created_at!: Date;
}