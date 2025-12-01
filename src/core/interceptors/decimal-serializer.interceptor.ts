import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isPrismaDecimalLike(obj: any) {
  return (
    obj && typeof obj === 'object' &&
    Array.isArray(obj.d) && typeof obj.e === 'number' && typeof obj.s === 'number'
  );
}

function decimalLikeToNumber(obj: any): number | null {
  try {
    // Heuristic: obj.d is an array of digit groups. Most common serialization from Decimal
    // appears as e.g. { d: [49,9000000], e: 1, s: 1 } which we interpret as 49.9000000
    if (!Array.isArray(obj.d) || obj.d.length === 0) return null;

    const sign = obj.s === -1 ? -1 : 1;
    const intPart = String(obj.d[0]);
    const fracPart = obj.d.length > 1 ? obj.d.slice(1).join('') : '';
    const text = fracPart ? `${intPart}.${fracPart}` : intPart;
    const n = Number(text);
    return Number.isFinite(n) ? sign * n : null;
  } catch {
    return null;
  }
}

function convertDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) return obj.map(convertDecimals);
  if (typeof obj !== 'object') return obj;

  // Preserve Dates, Buffers and other non-plain objects (they should not be recursed)
  if (obj instanceof Date) return obj;
  if (typeof Buffer !== 'undefined' && obj instanceof Buffer) return obj;

  // If object has a non-plain constructor (not a plain Object) and it's not a Decimal-like,
  // avoid recursing into it (prevents emptying Date and other instances).
  const ctorName = obj.constructor?.name;
  if (ctorName && ctorName !== 'Object' && typeof obj.toNumber !== 'function' && !isPrismaDecimalLike(obj)) {
    return obj;
  }

  // If object exposes toNumber (Prisma Decimal instance), use it
  if (typeof obj.toNumber === 'function') {
    try {
      return obj.toNumber();
    } catch {
      try {
        return Number(obj.toString());
      } catch {
        return obj;
      }
    }
  }

  // If object matches {d,e,s} structure, try to reconstruct numeric value
  if (isPrismaDecimalLike(obj)) {
    const val = decimalLikeToNumber(obj);
    if (val !== null) return val;
  }

  // Recurse into keys
  const out: any = {};
  for (const k of Object.keys(obj)) {
    out[k] = convertDecimals(obj[k]);
  }
  return out;
}

@Injectable()
export class DecimalSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => convertDecimals(data)));
  }
}
