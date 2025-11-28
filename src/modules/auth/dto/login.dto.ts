import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'fulano@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'strong-password', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'strong-password', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;
}
