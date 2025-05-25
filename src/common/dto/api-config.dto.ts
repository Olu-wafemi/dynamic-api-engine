import {
  IsString,
  IsNotEmpty,
  Equals,
  IsObject,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApiConfigDto {
  @ApiProperty({
    description: 'Unique name for API Configuration',
    example: 'user-validation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'HTTP method for the API endpoint',
    enum: ['POST'],
    example: 'POST',
  })
  @IsString()
  @Equals('POST', { message: 'Only POST method is supported' })
  method: 'POST';

  @ApiProperty({
    description:
      'Expected request body structure (define empty values for required fields)',
    example: {
      firstName: '',
      lastName: '',
      email: '',
    },
    additionalProperties: {
      type: 'string',
      description: 'Field name and empty string as placeholder',
    },
  })
  @IsObject()
  body: Record<string, any>;

  @ApiProperty({
    description:
      'Custom validation function as string. Must be properly formatted JavaScript with newlines and proper escaping.',
    example: `function customValidation(data) { const { firstName, lastName, email } = data.body; if (!firstName) {return { isValid: false, message: 'First name is required' };}if (!lastName) {  return { isValid: false, message: 'Lastname is required' };}if (!email) {  return { isValid: false, message: 'Email is required' };}const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;if (!emailRegex.test(email)) { return { isValid: false, message: 'Invalid email format' };}return { isValid: true, message: 'Data is valid' };}`,
    additionalProperties: {
      type: 'string',
      description:
        'Function must return an object with { isValid: boolean, message: string }',
    },
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^function\s+customValidation\s*\(/, {
    message:
      'customValidation must be a function string starting with "function customValidation("',
  })
  customValidation: string;
}
