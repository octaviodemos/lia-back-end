import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SkoobService {
  private readonly logger = new Logger(SkoobService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async fetchUserBookshelf(skoobUserId: string): Promise<unknown[]> {
    const base = (this.config.get<string>('SKOOB_API_BASE_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const url = `${base}/api/users/${encodeURIComponent(skoobUserId)}/bookshelf`;
    try {
      const res = await firstValueFrom(this.http.get<unknown>(url, { validateStatus: () => true }));
      const status = res.status;
      if (status < 200 || status >= 300) {
        this.logger.warn(`Skoob API respondeu HTTP ${status} para ${url}`);
        return [];
      }
      const body = res.data as unknown;
      if (Array.isArray(body)) {
        return body;
      }
      if (body && typeof body === 'object') {
        const o = body as Record<string, unknown>;
        if (Array.isArray(o.bookshelf)) return o.bookshelf;
        if (Array.isArray(o.books)) return o.books;
        if (Array.isArray(o.items)) return o.items;
      }
      return [];
    } catch (err) {
      this.logger.warn(`Falha ao consultar Skoob API: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }
}
