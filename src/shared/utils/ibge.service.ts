import { Injectable, BadRequestException } from '@nestjs/common';

export interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

export interface Municipio {
  id: number;
  nome: string;
}

@Injectable()
export class IbgeService {
  private readonly ibgeUrl = 'https://servicodados.ibge.gov.br/api/v1/localidades';

  async getEstados(): Promise<Estado[]> {
    try {
      const response = await fetch(`${this.ibgeUrl}/estados?orderBy=nome`);
      const estados = await response.json() as any[];
      
      return estados.map((estado: any) => ({
        id: estado.id,
        sigla: estado.sigla,
        nome: estado.nome,
      }));
    } catch (error) {
      throw new BadRequestException('Erro ao consultar estados');
    }
  }

  async getMunicipiosByEstado(ufId: number): Promise<Municipio[]> {
    try {
      const response = await fetch(`${this.ibgeUrl}/estados/${ufId}/municipios?orderBy=nome`);
      const municipios = await response.json() as any[];
      
      return municipios.map((municipio: any) => ({
        id: municipio.id,
        nome: municipio.nome,
      }));
    } catch (error) {
      throw new BadRequestException('Erro ao consultar municípios');
    }
  }

  async getMunicipiosBySigla(uf: string): Promise<Municipio[]> {
    try {
      const response = await fetch(`${this.ibgeUrl}/estados/${uf}/municipios?orderBy=nome`);
      const municipios = await response.json() as any[];
      
      return municipios.map((municipio: any) => ({
        id: municipio.id,
        nome: municipio.nome,
      }));
    } catch (error) {
      throw new BadRequestException('Erro ao consultar municípios');
    }
  }
}