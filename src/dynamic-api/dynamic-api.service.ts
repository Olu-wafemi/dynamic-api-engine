import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ExecutionService } from './execution.service';
import { ExecutionRequest } from '../common/interfaces/execution-request.interface';
import { ApiConfigDto } from '../common/dto/api-config.dto';

export interface ExecutionStats {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  lastExecuted: Date;
}

@Injectable()
export class DynamicApiService {
  private readonly logger = new Logger(DynamicApiService.name);
  private readonly executionStats = new Map<string, ExecutionStats>();

  constructor(
    private readonly configService: ConfigService,
    private readonly executionService: ExecutionService,
  ) {}

  async executeDynamicApi(executionRequest: ExecutionRequest): Promise<any> {
    const startTime = Date.now();
    try {
      const config = await this.getApiConfiguration(executionRequest.apiName);

      const executionData = {
        body: executionRequest.requestBody,
        headers: this.sanitizeHeaders(executionRequest.headers || {}),
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      };

      const executionResult = await this.executionService.executeValidation(
        config.customValidation,
        executionData,
      );

      this.logger.debug(
        `Processing validation result: ${JSON.stringify(executionResult)}`,
      );

      if (!executionResult.isValid) {
        throw new BadRequestException({
          message: executionResult.message,
          details: executionResult.data,
        });
      }

      const processedResult = {
        success: true,
        message: executionResult.message,
        data: executionResult.data,
      };

      this.recordExecution(
        executionRequest.apiName,
        Date.now() - startTime,
        true,
      );
      return this.formatSuccessResponse(processedResult, config);
    } catch (error) {
      this.recordExecution(
        executionRequest.apiName,
        Date.now() - startTime,
        false,
      );
      throw this.handleError(error);
    }
  }

  private async getApiConfiguration(apiName: string): Promise<ApiConfigDto> {
    const config = await this.configService.getConfig(apiName);
    if (!config) {
      throw new HttpException(
        {
          success: false,
          message: `API configuration '${apiName}' not found`,
          availableApis: (await this.configService.getAllConfigs()).map(
            (c) => c.name,
          ),
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return config;
  }

  private sanitizeHeaders(headers: Record<string, string>) {
    return {
      'content-type': headers['content-type'] || 'application/json',
      'user-agent': headers['user-agent'] || 'unknown',
      ...(headers['x-api-key'] && { 'x-api-key': headers['x-api-key'] }),
    };
  }

  private formatSuccessResponse(result: any, config: ApiConfigDto) {
    return {
      success: true,
      isValid: true,
      message: result.message || 'Validation passed successfully',
      timestamp: new Date().toISOString(),
      apiName: config.name,
      ...(result.data && { data: result.data }),
    };
  }

  private handleError(error: any): HttpException {
    if (error instanceof HttpException) {
      const response = error.getResponse() as any;
      return new HttpException(
        {
          success: false,
          isValid: false,
          message: response.message || error.message,
          details: response.details,
          timestamp: new Date().toISOString(),
        },
        error.getStatus(),
      );
    }

    return new HttpException(
      {
        success: false,
        isValid: false,
        message: error.message || 'An unexpected error occurred',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  recordExecution(
    apiName: string,
    executionTime: number,
    success: boolean,
  ): void {
    const stats = this.executionStats.get(apiName) || {
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
      lastExecuted: new Date(),
    };

    stats.totalExecutions++;
    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }

    stats.averageExecutionTime =
      (stats.averageExecutionTime * (stats.totalExecutions - 1) +
        executionTime) /
      stats.totalExecutions;

    stats.lastExecuted = new Date();
    this.executionStats.set(apiName, stats);
  }

  getApiStats(
    apiName?: string,
  ): ExecutionStats | Record<string, ExecutionStats> {
    if (apiName) {
      return (
        this.executionStats.get(apiName) || {
          totalExecutions: 0,
          successCount: 0,
          failureCount: 0,
          averageExecutionTime: 0,
          lastExecuted: null,
        }
      );
    }

    return Object.fromEntries(this.executionStats.entries());
  }
}
