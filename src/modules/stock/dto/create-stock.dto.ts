import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Matches } from 'class-validator';

export class CreateStockDto {
	@ApiProperty({ example: 1 })
	@IsInt()
	id_livro!: number;

	@ApiProperty({ example: 10 })
	@IsInt()
	@Min(1)
	quantidade!: number;

		@ApiProperty({ example: '49.90', description: 'Preço como string com 2 casas decimais, ex: "49.90"' })
		@IsString()
		@Matches(/^\d+(\.\d{1,2})?$/, { message: 'preco deve ser uma string numérica com até 2 casas decimais, ex: "49.90"' })
		preco!: string;

	@ApiProperty({ example: 'novo', required: false })
	@IsOptional()
	@IsString()
	condicao?: string;
}
