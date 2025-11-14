import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(_err, user, _info, _context, _status) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
