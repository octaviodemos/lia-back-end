import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: any) {
    try {
      console.debug('[DEBUG] JwtStrategy.validate payload keys:', Object.keys(payload || {}));
      console.debug('[DEBUG] JwtStrategy.validate sub:', payload?.sub);
    } catch (e) {
    }

    return { userId: payload.sub, email: payload.email };
  }
}
