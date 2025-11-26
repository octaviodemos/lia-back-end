import { Injectable, BadRequestException } from '@nestjs/common';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

@Injectable()
export class CepService {
  private readonly viaCepUrl = 'https://viacep.com.br/ws';

  async buscarEnderecoPorCep(cep: string): Promise<ViaCepResponse> {
    const cepLimpo = this.normalizeCep(cep);
    
    if (!this.validarCep(cepLimpo)) {
      throw new BadRequestException('CEP inválido');
    }

    try {
      const response = await fetch(`${this.viaCepUrl}/${cepLimpo}/json/`);
      const data = await response.json() as ViaCepResponse;
      
      if (data.erro) {
        throw new BadRequestException('CEP não encontrado');
      }

      return data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao consultar CEP');
    }
  }

  private normalizeCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  private validarCep(cep: string): boolean {
    return /^\d{8}$/.test(cep);
  }

  formatarCep(cep: string): string {
    const cepLimpo = this.normalizeCep(cep);
    return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
}