import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Usuario } from '@prisma/client';
import './passport'; 

export const ensureAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error, user: Usuario | false, _info: any) => {
      if (err || !user) {
        return res
          .status(401)
          .json({ message: 'Token JWT inválido ou expirado.' });
      }
      req.user = user;
      return next();
    },
  )(req, res, next);
};