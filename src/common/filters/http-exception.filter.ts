import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponseDto } from '../dto/error-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const errorResponse = new ErrorResponseDto();
    errorResponse.statusCode = status;
    errorResponse.message = exceptionResponse.message || exception.message;
    errorResponse.error = exceptionResponse.error || HttpStatus[status];
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.path = ctx.getRequest().url;

    response.status(status).json(errorResponse);
  }
}
