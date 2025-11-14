import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestWithUser } from '../../users/interfaces/request-user.interface';

export const GetUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request: RequestWithUser = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
