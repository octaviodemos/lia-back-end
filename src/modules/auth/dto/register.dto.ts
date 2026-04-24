import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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

  @ApiPropertyOptional({ example: '(48) 99999-0000' })
  @Transform(({ value }) => (value === '' || value == null ? undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[\d\s()\-+.]*$/, { message: 'telefone contém caracteres inválidos' })
  telefone?: string;

  @ApiProperty({ example: 'customer', required: false })
  @IsString()
  tipo_usuario?: string;
}
