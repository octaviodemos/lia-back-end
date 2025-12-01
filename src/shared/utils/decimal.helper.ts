import { Prisma } from '@prisma/client';

/**
 * Utilitário para conversão de valores Decimal do Prisma
 */
export class DecimalHelper {
  
  /**
   * Converte Decimal para string formatada com 2 casas decimais
   */
  static toString(decimal: any): string {
    if (!decimal) return '0.00';
    
    try {
      // Se for uma instância de Decimal do Prisma
      if (decimal instanceof Prisma.Decimal) {
        return decimal.toFixed(2);
      }
      
      // Se for um objeto com estrutura de Decimal {s, e, d}
      if (this.isDecimalObject(decimal)) {
        return this.decimalObjectToNumber(decimal).toFixed(2);
      }

      // Se for um número
      if (typeof decimal === 'number') {
        return decimal.toFixed(2);
      }

      // Se for uma string que representa um número
      if (typeof decimal === 'string' && !isNaN(parseFloat(decimal))) {
        return parseFloat(decimal).toFixed(2);
      }

      return '0.00';
    } catch (error) {
      console.warn('Erro ao converter decimal:', error, decimal);
      return '0.00';
    }
  }

  /**
   * Converte Decimal para número
   */
  static toNumber(decimal: any): number {
    const str = this.toString(decimal);
    return parseFloat(str);
  }

  /**
   * Verifica se um objeto é um Decimal do Prisma
   */
  private static isDecimalObject(obj: any): boolean {
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
   * Converte um objeto decimal {s, e, d} para número
   */
  private static decimalObjectToNumber(obj: any): number {
    try {
      const sign = obj.s || 1;
      const exponent = obj.e || 0;
      const digits = obj.d || [0];
      
      let numStr = digits.join('');
      let num = parseFloat(numStr);
      
      if (exponent !== 0) {
        num = num * Math.pow(10, exponent - digits.length + 1);
      }
      
      return num * sign;
    } catch (error) {
      console.warn('Erro ao converter objeto decimal:', error, obj);
      return 0;
    }
  }
}