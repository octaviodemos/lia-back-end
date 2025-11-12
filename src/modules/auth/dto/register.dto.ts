import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Fulano da Silva' })
  @IsString()
  nome!: string;

  @ApiProperty({ example: 'fulano@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'strong-password' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'customer', required: false })
  @IsString()
  tipo_usuario?: string;
}
