import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEmail, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentItemDto {
  @ApiProperty({ description: 'ID do produto/serviço' })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Título do item' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Categoria do item' })
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiProperty({ description: 'Quantidade' })
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiProperty({ description: 'Preço unitário' })
  @IsNotEmpty()
  @IsNumber()
  unit_price!: number;

  @ApiProperty({ description: 'Descrição do item', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Email do comprador' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Nome do comprador' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'CPF do comprador' })
  @IsNotEmpty()
  @IsString()
  cpf!: string;

  @ApiProperty({ description: 'Sobrenome do comprador', required: false })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiProperty({ type: [PaymentItemDto], description: 'Itens da compra' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items!: PaymentItemDto[];

  @ApiProperty({ description: 'URL de retorno após pagamento bem-sucedido' })
  @IsOptional()
  @IsString()
  success_url?: string;

  @ApiProperty({ description: 'URL de retorno após pagamento falhou' })
  @IsOptional()
  @IsString()
  failure_url?: string;

  @ApiProperty({ description: 'URL de retorno após pagamento pendente' })
  @IsOptional()
  @IsString()
  pending_url?: string;

  @ApiProperty({ description: 'ID do pedido no sistema', required: false })
  @IsOptional()
  @IsString()
  order_id?: string;
}

export class CreatePaymentFromCartDto {
  @ApiProperty({ description: 'Email do comprador' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Nome do comprador' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'CPF do comprador' })
  @IsNotEmpty()
  @IsString()
  cpf!: string;

  @ApiProperty({ description: 'Sobrenome do comprador', required: false })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiProperty({ description: 'URL de retorno após pagamento bem-sucedido', required: false })
  @IsOptional()
  @IsString()
  success_url?: string;

  @ApiProperty({ description: 'URL de retorno após pagamento falhou', required: false })
  @IsOptional()
  @IsString()
  failure_url?: string;

  @ApiProperty({ description: 'URL de retorno após pagamento pendente', required: false })
  @IsOptional()
  @IsString()
  pending_url?: string;
}

// DTO para Checkout Transparente (processamento direto)
export class CreateDirectPaymentDto {
  @ApiProperty({ description: 'Email do comprador' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Nome do comprador' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'CPF do comprador' })
  @IsNotEmpty()
  @IsString()
  cpf!: string;

  @ApiProperty({ description: 'Sobrenome do comprador' })
  @IsNotEmpty()
  @IsString()
  surname!: string;

  @ApiProperty({ description: 'Token do cartão gerado pelo frontend' })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ description: 'ID do método de pagamento (visa, master, etc.)' })
  @IsNotEmpty()
  @IsString()
  paymentMethodId!: string;

  @ApiProperty({ description: 'ID do emissor do cartão' })
  @IsOptional()
  @IsString()
  issuerId?: string;

  @ApiProperty({ description: 'Número de parcelas', required: false })
  @IsOptional()
  @IsNumber()
  installments?: number;
}

export class WebhookDto {
  @ApiProperty({ description: 'ID do pagamento' })
  id!: string;

  @ApiProperty({ description: 'Tópico da notificação' })
  topic!: string;

  @ApiProperty({ description: 'Tipo de notificação' })
  type!: string;

  @ApiProperty({ description: 'Data de criação da notificação' })
  date_created!: string;

  @ApiProperty({ description: 'ID da aplicação' })
  application_id!: string;

  @ApiProperty({ description: 'ID do usuário' })
  user_id!: string;

  @ApiProperty({ description: 'Versão da API' })
  version!: string;

  @ApiProperty({ description: 'Ação da notificação' })
  action!: string;

  @ApiProperty({ description: 'Live mode' })
  live_mode!: boolean;

  @ApiProperty({ description: 'Dados da notificação' })
  data!: {
    id: string;
  };
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'ID da preferência' })
  id!: string;

  @ApiProperty({ description: 'URL de checkout' })
  init_point!: string;

  @ApiProperty({ description: 'URL de checkout para sandbox' })
  sandbox_init_point!: string;

  @ApiProperty({ description: 'Status da preferência' })
  status!: string;
}