import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private healthCheck: HealthCheckService,
    private httpHealth: HttpHealthIndicator,
    private dbHealth: TypeOrmHealthIndicator,
  ) {}

  check() {
    this.logger.log('Health check made successfully');
    return this.healthCheck.check([
      () => this.httpHealth.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      () => this.dbHealth.pingCheck('database'),
    ]);
  }
}
