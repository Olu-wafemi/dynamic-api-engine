import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationErrorResponseDto } from '../dto/error-response.dto';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const errorResponse = new ValidationErrorResponseDto();
    errorResponse.statusCode = status;
    errorResponse.message = Array.isArray(exceptionResponse.message)
      ? exceptionResponse.message
      : [exceptionResponse.message];
    errorResponse.error = 'Bad Request';
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.path = ctx.getRequest().url;

    response.status(status).json(errorResponse);
  }
}
