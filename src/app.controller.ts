import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from './config/config.service';
import { DynamicApiService } from './dynamic-api/dynamic-api.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly dynamicApiService: DynamicApiService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Get system health status',
    description: 'Check the health status of all system components',
  })
  @ApiResponse({
    status: 200,
    description: 'System health information',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'healthy',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-20T10:30:00Z',
        },
        components: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'healthy',
                },
                totalConfigs: {
                  type: 'number',
                  example: 5,
                },
              },
            },
            api: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'healthy',
                },
                totalApis: {
                  type: 'number',
                  example: 3,
                },
                stats: {
                  type: 'object',
                  properties: {
                    totalExecutions: {
                      type: 'number',
                      example: 15,
                    },
                    successCount: {
                      type: 'number',
                      example: 13,
                    },
                    failureCount: {
                      type: 'number',
                      example: 2,
                    },
                    averageExecutionTime: {
                      type: 'number',
                      example: 23.33,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getHealth() {
    const configCount = this.configService.getConfigCount();
    const apiStats = await this.dynamicApiService.getApiStats();

    const totalExecutions = Object.values(apiStats).reduce(
      (sum, stat) => sum + stat.totalExecutions,
      0,
    );
    const successCount = Object.values(apiStats).reduce(
      (sum, stat) => sum + stat.successCount,
      0,
    );
    const failureCount = Object.values(apiStats).reduce(
      (sum, stat) => sum + stat.failureCount,
      0,
    );
    const averageExecutionTime =
      Object.values(apiStats).reduce(
        (sum, stat) => sum + stat.averageExecutionTime,
        0,
      ) / Object.keys(apiStats).length;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        config: {
          status: 'healthy',
          totalConfigs: configCount,
        },
        api: {
          status: 'healthy',
          totalApis: Object.keys(apiStats).length,
          stats: {
            totalExecutions,
            successCount,
            failureCount,
            averageExecutionTime,
          },
        },
      },
    };
  }
}
