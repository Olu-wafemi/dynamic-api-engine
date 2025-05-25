import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { DynamicApiService } from './dynamic-api.service';
import { ExecutionRequestDto } from '../common/dto/execution-request.dto';
import { ExecutionRequest } from '../common/interfaces/execution-request.interface';

@ApiTags('Dynamic APIs')
@Controller('api')
export class DynamicApiController {
  constructor(private readonly dynamicApiService: DynamicApiService) {}

  @Post(':name')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Execute a dynamic API',
    description: 'Execute a dynamic API with the given name and request body',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
  })
  @ApiParam({
    name: 'name',
    description: 'Name of the API to execute',
    example: 'user-validation',
  })
  @ApiBody({
    type: ExecutionRequestDto,
  })
  @ApiResponse({
    status: 200,
    description: 'API executed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Validation passed successfully' },
        data: { type: 'object', additionalProperties: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Lastname is required' },
        details: { type: 'object', additionalProperties: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'API not found',
  })
  async executeDynamicApi(
    @Param('name') apiName: string,
    @Body() executionRequest: ExecutionRequestDto,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    const request: ExecutionRequest = {
      apiName,
      requestBody: executionRequest.body,
      headers,
    };
    return this.dynamicApiService.executeDynamicApi(request);
  }
}
