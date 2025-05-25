import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiConfig } from '../common/interfaces/api-config.interface';
import { ApiConfigDto } from '../common/dto/api-config.dto';
import * as crypto from 'crypto';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly configs = new Map<string, ApiConfig>();
  private readonly apiKeys = new Map<
    string,
    {
      key: string;
      name: string;
      createdAt: Date;
      lastUsed?: Date;
    }
  >();

  async saveConfig(apiConfigDto: ApiConfigDto): Promise<ApiConfig> {
    const { name } = apiConfigDto;

    if (this.configs.has(name)) {
      throw new ConflictException(`API configuration '${name}' already exists`);
    }

    this.validateCustomFunction(apiConfigDto.customValidation);

    const config: ApiConfig = {
      name: apiConfigDto.name,
      method: apiConfigDto.method,
      body: apiConfigDto.body,
      customValidation: apiConfigDto.customValidation,
    };

    this.configs.set(name, config);
    this.logger.log(`Saved configuration for API: ${name}`);
    return config;
  }

  async getConfig(name: string): Promise<ApiConfig> {
    const config = this.configs.get(name);

    if (!config) {
      throw new NotFoundException(
        `Configuration with name '${name}' not found`,
      );
    }

    return config;
  }

  async getAllConfigs(): Promise<ApiConfig[]> {
    return Array.from(this.configs.values());
  }

  async configExists(name: string): Promise<boolean> {
    return this.configs.has(name);
  }

  async deleteConfig(name: string): Promise<void> {
    if (!this.configs.has(name)) {
      throw new NotFoundException(`Configuration with '${name}' not found`);
    }

    this.configs.delete(name);
  }

  getConfigCount(): number {
    return this.configs.size;
  }

  private validateCustomFunction(customValidation: string): void {
    try {
      const functionCheck = customValidation.trim();

      if (!functionCheck.startsWith('function customValidation(')) {
        throw new Error(
          'Function must start with "function customValidation("',
        );
      }

      if (!functionCheck.includes('{') || !functionCheck.includes('}')) {
        throw new Error('Function must have proper opening and closing braces');
      }

      // A test function to validate the return format
      const testFunction = new Function(`
        ${customValidation}
        const result = customValidation({ body: {} });
        if (!result || typeof result !== 'object') {
          throw new Error('Function must return an object');
        }
        if (typeof result.isValid !== 'boolean') {
          throw new Error('Return object must include "isValid" as a boolean');
        }
        if (typeof result.message !== 'string') {
          throw new Error('Return object must include "message" as a string');
        }
        return true;
      `);

      testFunction();
    } catch (error) {
      throw new ConflictException(
        `Invalid custom validation function: ${error.message}. ` +
          `Function must be valid JavaScript starting with "function customValidation(data) { ... }" ` +
          `and return an object with { isValid: boolean, message: string }`,
      );
    }
  }

  generateApiKey(name: string): string {
    const key = crypto.randomBytes(32).toString('hex');
    this.apiKeys.set(key, {
      key,
      name,
      createdAt: new Date(),
    });
    return key;
  }

  validateApiKey(key: string): boolean {
    const apiKey = this.apiKeys.get(key);
    if (apiKey) {
      apiKey.lastUsed = new Date();
      return true;
    }
    return false;
  }

  getApiKeyInfo(key: string) {
    return this.apiKeys.get(key);
  }
}
