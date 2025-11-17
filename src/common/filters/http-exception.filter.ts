import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseObject {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status === (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error(
        `Http Status: ${status} Error message: ${JSON.stringify(exceptionResponse)}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(
        `Address: ${request.url} | Method: ${request.method} | Error: ${JSON.stringify(exceptionResponse)}`,
      );
    }

    // 3. Tratamento seguro da mensagem sem usar 'any'
    let errorMessage: string | string[];

    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else {
      // Aqui dizemos ao TS: "Trate isso como o objeto ErrorResponseObject", em vez de "any"
      errorMessage = (exceptionResponse as ErrorResponseObject).message;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorMessage,
    });
  }
}
