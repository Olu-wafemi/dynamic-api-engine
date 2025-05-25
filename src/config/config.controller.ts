import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiSecurity,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { ApiConfigDto } from '../common/dto/api-config.dto';
import { ApiConfig } from '../common/interfaces/api-config.interface';

@ApiTags('API Configuration')
@Controller('config')
@ApiBearerAuth()
@ApiSecurity('x-api-key')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post('api-key')
  @ApiOperation({
    summary: 'Generate a new API key',
    description: 'Create a new API key for accessing the dynamic API endpoints',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name/description for the API key',
          example: 'Production API Key',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'API key generated successfully',
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'The generated API key',
          example: 'a1b2c3d4...',
        },
        name: {
          type: 'string',
          description: 'Name of the API key',
          example: 'Production API Key',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'When the key was created',
        },
      },
    },
  })
  async generateApiKey(@Body('name') name: string) {
    const key = await this.configService.generateApiKey(name);
    return {
      key,
      name,
      createdAt: new Date(),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create new API configuration',
    description: 'Create a new API configuration with custom validation logic',
  })
  @ApiBody({
    type: ApiConfigDto,
  })
  @ApiResponse({
    status: 201,
    description: 'API configuration created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'API configuration created successfully',
        },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'user-validation' },
            method: { type: 'string', example: 'POST' },
            body: {
              type: 'object',
              properties: {
                firstName: { type: 'string', example: '' },
                lastName: { type: 'string', example: '' },
                email: { type: 'string', example: '' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'API configuration already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid configuration data',
  })
  async saveConfig(@Body() apiConfigDto: ApiConfigDto): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    const config = await this.configService.saveConfig(apiConfigDto);
    return {
      success: true,
      message: 'API configuration created successfully',
      data: config,
    };
  }

  @Get(':name')
  @ApiOperation({
    summary: 'Get a specific API configuration',
    description: 'Retrieve configuration details by name',
  })
  @ApiParam({
    name: 'name',
    description: 'Configuration name',
    example: 'test-api',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration found',
    schema: {
      example: {
        name: 'test-api',
        method: 'POST',
        body: { email: '', username: '' },
        customValidation: 'function customValidation(data) { ... }',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Configuration not found',
  })
  async getConfig(@Param('name') name: string): Promise<ApiConfig> {
    return await this.configService.getConfig(name);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all API configurations',
    description:
      'Retrieve all stored configurations (for debugging/admin purposes)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all configurations',
    schema: {
      example: [
        {
          name: 'test-api',
          method: 'POST',
          body: { email: '', username: '' },
          customValidation: 'function customValidation(data) { ... }',
        },
      ],
    },
  })
  async getAllConfigs(): Promise<{
    count: number;
    configs: ApiConfig[];
  }> {
    const configs = await this.configService.getAllConfigs();

    return {
      count: configs.length,
      configs,
    };
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an API configuration',
    description: 'Remove a configuration by name',
  })
  @ApiParam({
    name: 'name',
    description: 'Configuration name to delete',
    example: 'test-api',
  })
  @ApiResponse({
    status: 204,
    description: 'Configuration deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuration not found',
  })
  async deleteConfig(@Param('name') name: string): Promise<void> {
    await this.configService.deleteConfig(name);
  }
}
