import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any) {
    // Only emit debug logs when explicitly enabled (avoids noisy output in production)
    try {
      if (process.env.DEBUG_JWT === 'true') {
        this.logger.debug('JwtStrategy.validate payload keys: ' + JSON.stringify(Object.keys(payload || {})));
        this.logger.debug('JwtStrategy.validate sub: ' + payload?.sub);
      }
    } catch (e) {
      // swallow any logging errors
    }
   return { id: payload.sub, email: payload.email };
  }
}
