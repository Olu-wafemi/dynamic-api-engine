import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid configuration data',
  })
  message: string;

  @ApiProperty({
    description: 'Error type/category',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp when error occurred',
    example: '2024-01-20T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/config',
  })
  path: string;
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Detailed validation errors',
    example: [
      'name should not be empty',
      'method must be one of the following values: POST',
    ],
  })
  message: string;
}
