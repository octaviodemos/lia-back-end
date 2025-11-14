import { IsOptional, IsString, IsNumber } from 'class-validator';

export class ConfirmOrderDto {
  @IsOptional()
  @IsString()
  id_transacao_gateway?: string;

  @IsOptional()
  @IsString()
  metodo_pagamento?: string;

  @IsOptional()
  @IsNumber()
  valor_pago?: number;
}
