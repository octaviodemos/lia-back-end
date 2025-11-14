import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest?.();
    const method = req?.method ?? 'UNKNOWN';
    const url = req?.originalUrl ?? req?.url ?? 'UNKNOWN';

    // Try to read request id (if present)
    const requestId = req?.headers?.['x-request-id'] ?? req?.id ?? null;

    const user = req?.user ?? {};
    const userId = user?.id ?? user?.userId ?? user?.sub ?? user?.id_usuario ?? user?.user_id ?? 'anonymous';

    const prefix = requestId ? `[rid:${requestId}] ` : '';
    const startedAt = Date.now();

    this.logger.log(`${prefix}→ ${method} ${url} — user: ${userId}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - startedAt;
          this.logger.log(`${prefix}← ${method} ${url} — user: ${userId} — ${elapsed}ms`);
        },
        error: (err) => {
          const elapsed = Date.now() - startedAt;
          this.logger.error(`${prefix}✖ ${method} ${url} — user: ${userId} — ${elapsed}ms — ${err?.message ?? err}`);
        },
      }),
    );
  }
}
