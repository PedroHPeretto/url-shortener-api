import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestWithUser } from '../../users/interfaces/request-user.interface';

export const GetUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request: RequestWithUser = ctx.switchToHttp().getRequest();

    if (!request.user) {
      throw new Error('Usuário não encontrado no Request');
    }

    if (data) {
      return request.user[data];
    }

    return request.user;
  },
);
