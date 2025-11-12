import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

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
	@IsInt()
	ano_publicacao?: number;

	@ApiProperty({ example: '978-xxx', required: false })
	@IsOptional()
	@IsString()
	isbn?: string;

	@ApiProperty({ example: 'https://...', required: false })
	@IsOptional()
	@IsString()
	capa_url?: string;
}
