import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

/**
 * Interceptor que converte todos os campos do tipo Decimal do Prisma
 * para strings antes de enviar a resposta ao cliente.
 * 
 * Isso resolve o problema de serialização onde o PostgreSQL Decimal
 * é convertido para objetos complexos como {"s": 1, "e": 1, "d": [33]}
 */
@Injectable()
export class DecimalSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.convertDecimals(data)));
  }

  /**
   * Converte recursivamente todos os objetos Decimal para strings
   */
  private convertDecimals(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Se for um Decimal do Prisma, converte para string
    if (data instanceof Prisma.Decimal || this.isDecimalObject(data)) {
      return this.decimalToString(data);
    }

    // Se for um array, processa cada item
    if (Array.isArray(data)) {
      return data.map((item) => this.convertDecimals(item));
    }

    // Se for um objeto, processa cada propriedade
    if (typeof data === 'object') {
      const converted: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          converted[key] = this.convertDecimals(data[key]);
        }
      }
      return converted;
    }

    // Tipos primitivos retornam como estão
    return data;
  }

  /**
   * Verifica se um objeto é um Decimal do Prisma
   * (tem a estrutura interna {s, e, d})
   */
  private isDecimalObject(obj: any): boolean {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      's' in obj &&
      'e' in obj &&
      'd' in obj &&
      Array.isArray(obj.d)
    );
  }

  /**
   * Converte Decimal para string formatada com 2 casas decimais
   */
  private decimalToString(decimal: any): string {
    try {
      // Se for uma instância de Decimal do Prisma
      if (decimal instanceof Prisma.Decimal) {
        return decimal.toFixed(2);
      }
      
      // Se for um objeto com estrutura de Decimal
      if (this.isDecimalObject(decimal)) {
        // Reconstrói o Decimal a partir do objeto
        const d = new Prisma.Decimal(decimal);
        return d.toFixed(2);
      }

      return '0.00';
    } catch (error) {
      console.error('Erro ao converter Decimal:', error);
      return '0.00';
    }
  }
}
