import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidationResultDto {
  @ApiProperty({
    description: 'Whether the validation passed',
    example: true,
  })
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({
    description: 'Validation result message',
    example: 'Validation passed successfully',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Additional data returned by the validation',
    required: false,
    example: {
      additionalData: 'extra info',
      count: 42,
      nested: {
        value: 'safe',
        numbers: [1, 2, 3],
      },
    },
  })
  @IsOptional()
  data?: Record<string, any>;
}
