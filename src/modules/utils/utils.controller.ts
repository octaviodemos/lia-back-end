import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CepService, ViaCepResponse } from '../../shared/utils/cep.service';
import { IbgeService, Estado, Municipio } from '../../shared/utils/ibge.service';

@Controller('utils')
@ApiTags('Utils')
export class UtilsController {
  constructor(
    private cepService: CepService,
    private ibgeService: IbgeService,
  ) {}

  @Get('cep/:cep')
  @ApiOperation({ summary: 'Buscar endereço por CEP via ViaCEP' })
  @ApiParam({ name: 'cep', example: '01310-100' })
  @ApiResponse({ status: 200, description: 'Dados do endereço' })
  async buscarCep(@Param('cep') cep: string): Promise<ViaCepResponse> {
    return this.cepService.buscarEnderecoPorCep(cep);
  }

  @Get('estados')
  @ApiOperation({ summary: 'Listar todos os estados brasileiros' })
  @ApiResponse({ status: 200, description: 'Lista de estados' })
  async getEstados(): Promise<Estado[]> {
    return this.ibgeService.getEstados();
  }

  @Get('estados/:uf/municipios')
  @ApiOperation({ summary: 'Listar municípios por UF' })
  @ApiParam({ name: 'uf', example: 'SP' })
  @ApiResponse({ status: 200, description: 'Lista de municípios' })
  async getMunicipios(@Param('uf') uf: string): Promise<Municipio[]> {
    return this.ibgeService.getMunicipiosBySigla(uf);
  }
}