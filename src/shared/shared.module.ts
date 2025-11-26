import { Module, Global } from '@nestjs/common';
import { CepService } from './utils/cep.service';
import { IbgeService } from './utils/ibge.service';

@Global()
@Module({
  providers: [CepService, IbgeService],
  exports: [CepService, IbgeService],
})
export class SharedModule {}