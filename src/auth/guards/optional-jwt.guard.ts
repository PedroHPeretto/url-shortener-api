import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(
    _err: any,
    user: any,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
