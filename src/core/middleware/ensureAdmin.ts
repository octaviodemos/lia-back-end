import { Request, Response, NextFunction } from 'express';
import { Usuario } from '@prisma/client';

export const ensureAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user as Usuario;

  if (user && user.tipo_usuario === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Acesso negado. Requer permissão de administrador.' });
};