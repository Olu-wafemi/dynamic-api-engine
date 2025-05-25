import { Injectable, Logger } from '@nestjs/common';
import { ExecutionData } from 'src/common/interfaces/api-config.interface';
import { ValidationResultDto } from '../common/dto/validation-result.dto';
import { VM } from 'vm2';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);
  private readonly EXECUTION_TIMEOUT = 100;
  private readonly MAX_MEMORY = 32 * 1024 * 1024;
  private readonly MEMORY_CHECK_INTERVAL = 5;

  async executeValidation(
    customValidationCode: string,
    executionData: ExecutionData,
  ): Promise<ValidationResultDto> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Execution validation for data: ${JSON.stringify(executionData)}`,
      );

      const sandbox = this.createSecureSandbox(executionData);
      const result = await this.runInSandbox(customValidationCode, sandbox);
      const validatedResult = this.validateExecutionResult(result);

      const executionTime = Date.now() - startTime;
      this.logger.debug(
        `Validation executed successfully in ${executionTime}ms`,
      );

      return validatedResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Validation execution failed after ${executionTime}ms: ${error.message}`,
      );
      return {
        isValid: false,
        message: `Execution error: ${this.sanitizeErrorMessage(error.message)}`,
      };
    }
  }

  private createSecureSandbox(executionData: ExecutionData): VM {
    const vm = new VM({
      timeout: this.EXECUTION_TIMEOUT,
      sandbox: {
        data: executionData,
        JSON: {
          stringify: JSON.stringify,
          parse: JSON.parse,
        },
        Math: {
          abs: Math.abs,
          ceil: Math.ceil,
          floor: Math.floor,
          max: Math.max,
          min: Math.min,
          round: Math.round,
        },
        RegExp: RegExp,
        String: String,
        Date: Date,
        console: {
          log: this.logger.debug.bind(this.logger),
          error: this.logger.error.bind(this.logger),
        },
      },
      eval: false,
      wasm: false,
      fixAsync: true,
      compiler: 'javascript',
    });

    return vm;
  }

  private async runInSandbox(
    customValidationCode: string,
    sandbox: VM,
  ): Promise<any> {
    let memoryCheckInterval: NodeJS.Timeout;

    try {
      memoryCheckInterval = setInterval(() => {
        const used = process.memoryUsage();
        if (used.heapUsed > this.MAX_MEMORY) {
          clearInterval(memoryCheckInterval);
          throw new Error('Memory limit exceeded');
        }
      }, this.MEMORY_CHECK_INTERVAL);

      const wrappedCode = `
        ${customValidationCode}
        if (typeof customValidation !== 'function') {
          throw new Error('customValidation is not a function');
        }
        const result = customValidation(data);
        if (result && typeof result === 'object') {
          result;
        } else {
          throw new Error('Validation function must return an object');
        }
      `;

      const result = await sandbox.run(wrappedCode);
      clearInterval(memoryCheckInterval);
      return result;
    } catch (error) {
      clearInterval(memoryCheckInterval);
      if (error.message === 'Memory limit exceeded') {
        throw error;
      } else if (error.message.includes('Script execution timed out')) {
        throw new Error(
          'Execution timeout: Code took too long to execute (max 100ms)',
        );
      } else if (error.message.includes('Access denied')) {
        throw new Error(
          'Security violation: Attempted to access restricted resources',
        );
      } else {
        throw new Error(`Runtime error: ${error.message}`);
      }
    }
  }

  private validateExecutionResult(result: any): ValidationResultDto {
    if (!result || typeof result !== 'object') {
      throw new Error('Validation function must return an object');
    }

    if (typeof result.isValid !== 'boolean') {
      throw new Error('Validation result must include "isValid" as a boolean');
    }

    if (typeof result.message !== 'string') {
      throw new Error('Validation result must include "message" as a string');
    }

    const validationResult = new ValidationResultDto();
    validationResult.isValid = result.isValid;
    validationResult.message = result.message;

    const additionalProps = { ...result };
    delete additionalProps.isValid;
    delete additionalProps.message;

    if (Object.keys(additionalProps).length > 0) {
      validationResult.data = this.sanitizeValue(additionalProps);
    }

    return validationResult;
  }

  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) return value;

    const type = typeof value;
    if (['string', 'number', 'boolean'].includes(type)) return value;

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (type === 'object' && value.constructor === Object) {
      const sanitized: Record<string, any> = {};
      for (const key in value) {
        if (
          value.hasOwnProperty(key) &&
          !['__proto__', 'constructor', 'prototype'].includes(key)
        ) {
          const itemValue = value[key];
          if (this.isSafeValue(itemValue)) {
            sanitized[key] = this.sanitizeValue(itemValue);
          }
        }
      }
      return Object.keys(sanitized).length > 0 ? sanitized : undefined;
    }

    return undefined;
  }

  private isSafeValue(value: any): boolean {
    if (value === null || value === undefined) return true;

    const type = typeof value;
    if (['string', 'number', 'boolean'].includes(type)) return true;

    if (Array.isArray(value)) {
      return value.every((item) => this.isSafeValue(item));
    }

    if (type === 'object' && value.constructor === Object) {
      return Object.entries(value).every(
        ([key, item]) =>
          !['__proto__', 'constructor', 'prototype'].includes(key) &&
          this.isSafeValue(item),
      );
    }

    return false;
  }

  private sanitizeErrorMessage(message: string): string {
    return message
      .replace(/\/[^\s]+/g, '[path]') // Remove file paths
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]') // Remove IP addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]') // Remove emails
      .substring(0, 200); // Limit message length
  }
}
