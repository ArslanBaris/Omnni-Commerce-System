import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Tüm exception'ları yakalar ve standart bir formata dönüştürür.
 * HTTP context'te çalışır (Gateway'de kullanılır).
 * Microservice context'te bu filter devreye girmez — servisler kendi hatalarını
 * throw ederek caller'a RpcException olarak iletir.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    console.error(
      `[${request.method}] ${request.url} → ${status}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
