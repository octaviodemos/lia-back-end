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
  unidade?: string;
  regiao?: string;
}

@Injectable()
export class CepService {
  private readonly viaCepUrl = 'https://viacep.com.br/ws';
  private readonly brasilApiCepUrl = 'https://brasilapi.com.br/api/cep/v1';
  private readonly fetchTimeoutMs = 10000;

  async buscarEnderecoPorCep(cep: string): Promise<ViaCepResponse> {
    const cepLimpo = this.normalizeCep(cep);

    if (!this.validarCep(cepLimpo)) {
      throw new BadRequestException('CEP inválido');
    }

    const viaCep = await this.buscarViaCep(cepLimpo);
    if (viaCep) {
      return this.sanitizarResposta(viaCep);
    }

    const brasilApi = await this.buscarBrasilApi(cepLimpo);
    if (brasilApi) {
      return brasilApi;
    }

    throw new BadRequestException('CEP não encontrado');
  }

  private async buscarViaCep(cepLimpo: string): Promise<ViaCepResponse | null> {
    try {
      const response = await this.fetchComTimeout(`${this.viaCepUrl}/${cepLimpo}/json/`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'LIA-Backend/1.0 (CEP; +https://viacep.com.br/)',
        },
      });

      if (!response.ok) {
        return null;
      }

      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('application/json') && !ct.includes('text/javascript')) {
        return null;
      }

      const data = (await response.json()) as ViaCepResponse;

      if (!data || typeof data !== 'object' || data.erro === true) {
        return null;
      }

      const loc = (data.localidade || '').toString().trim();
      const uf = (data.uf || '').toString().trim();
      if (!loc || !uf) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private async buscarBrasilApi(cepLimpo: string): Promise<ViaCepResponse | null> {
    try {
      const response = await this.fetchComTimeout(`${this.brasilApiCepUrl}/${cepLimpo}`, {
        headers: { Accept: 'application/json' },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const b = (await response.json()) as Record<string, unknown>;

      if (b == null || typeof b !== 'object' || b.message != null) {
        return null;
      }

      const state = (b['state'] as string) || '';
      const city = (b['city'] as string) || '';
      if (!state.trim() || !city.trim()) {
        return null;
      }

      const cepResposta = (b['cep'] as string) || this.formatarCep(cepLimpo);
      return {
        cep: cepResposta,
        logradouro: String(b['street'] || ''),
        complemento: String(b['complement'] || ''),
        bairro: String(b['neighborhood'] || ''),
        localidade: city,
        uf: state,
        ibge: b['ibge'] != null ? String(b['ibge']) : '',
        gia: String(b['gia'] || ''),
        ddd: String(b['ddd'] || ''),
        siafi: String(b['siafi'] || ''),
      };
    } catch {
      return null;
    }
  }

  private sanitizarResposta(d: ViaCepResponse): ViaCepResponse {
    return {
      ...d,
      logradouro: (d.logradouro || '').toString().trim(),
      complemento: (d.complemento || '').toString().trim(),
      bairro: (d.bairro || '').toString().trim(),
      localidade: (d.localidade || '').toString().trim(),
      uf: (d.uf || '').toString().trim().toUpperCase().slice(0, 2),
    };
  }

  private async fetchComTimeout(
    url: string,
    init: RequestInit,
  ): Promise<globalThis.Response> {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), this.fetchTimeoutMs);
    try {
      return await fetch(url, { ...init, signal: ac.signal });
    } finally {
      clearTimeout(t);
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
