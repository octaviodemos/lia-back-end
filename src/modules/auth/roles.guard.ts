import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    try {
      console.debug('[DEBUG] RolesGuard requiredRoles:', requiredRoles);
      console.debug('[DEBUG] RolesGuard req.user:', user);
    } catch (e) {
    }

    if (!user) return false;

    const dbUser = await this.prisma.usuario.findUnique({
      where: { id_usuario: user.userId },
      select: { tipo_usuario: true },
    });
    try {
      console.debug('[DEBUG] RolesGuard dbUser:', dbUser);
    } catch (e) {
    }
    if (!dbUser) return false;

    return requiredRoles.includes(dbUser.tipo_usuario);
  }
}
