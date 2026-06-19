import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      const responseObj = exception.getResponse() as any;

      if (typeof responseObj === 'string') {
        message = responseObj;
      } else {
        message = responseObj.message || exception.message;
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
          details = responseObj.message.map((msg: string) => {
            // Parse common class-validator message prefixes if needed
            return { message: msg };
          });
        }
      }

      if (code === 'INTERNAL_SERVER_ERROR' && exception.name) {
        code = exception.name;
      }
    } else {
      // Log unhandled exceptions
      console.error('❌ Unhandled Exception:', exception);
      message = exception.message || message;
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
