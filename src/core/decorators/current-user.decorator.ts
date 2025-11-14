import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Usage:
 *  @CurrentUser() user => full user object
 *  @CurrentUser('id') id => normalized id (id | userId | sub | id_usuario | user_id)
 */
export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const user = req?.user || {};
  if (!data) return user;

  if (data === 'id') {
    return user?.id ?? user?.userId ?? user?.sub ?? user?.id_usuario ?? user?.user_id ?? null;
  }

  return user[data];
});
