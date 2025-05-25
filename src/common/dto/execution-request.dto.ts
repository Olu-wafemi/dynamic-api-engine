import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecutionRequestDto {
  @ApiProperty({
    description: 'Dynamic request body - can contain any valid JSON structure',
    example: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
    additionalProperties: true,
  })
  @IsObject()
  @IsNotEmpty()
  body: Record<string, any>;
}
