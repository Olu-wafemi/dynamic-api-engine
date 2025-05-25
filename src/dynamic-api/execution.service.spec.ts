import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from './execution.service';
import { ExecutionData } from '../common/interfaces/api-config.interface';

describe('ExecutionService', () => {
  let service: ExecutionService;

  const mockExecutionData: ExecutionData = {
    body: {
      email: 'test@example.com',
      username: 'testuser',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecutionService],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeValidation', () => {
    it('should execute valid validation function successfully', async () => {
      const validationCode = `
        function customValidation(data) {
          if (!data.body.email) {
            return { isValid: false, message: 'Email is required' };
          }
          return { isValid: true, message: 'Valid email' };
        }
      `;

      const result = await service.executeValidation(
        validationCode,
        mockExecutionData,
      );

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Valid email');
    });

    it('should handle validation failure correctly', async () => {
      const validationCode = `
        function customValidation(data) {
          return { isValid: false, message: 'Validation failed' };
        }
      `;

      const result = await service.executeValidation(
        validationCode,
        mockExecutionData,
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Validation failed');
    });

    it('should handle syntax errors safely', async () => {
      const invalidCode = `
        function customValidation(data) {
          this is invalid syntax !!!
        }
      `;

      const result = await service.executeValidation(
        invalidCode,
        mockExecutionData,
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Execution error');
    });

    it('should handle missing return statement', async () => {
      const noReturnCode = `
        function customValidation(data) {
         
        }
      `;

      const result = await service.executeValidation(
        noReturnCode,
        mockExecutionData,
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Execution error');
    });

    it('should handle invalid return format', async () => {
      const invalidReturnCode = `
        function customValidation(data) {
          return "just a string";
        }
      `;

      const result = await service.executeValidation(
        invalidReturnCode,
        mockExecutionData,
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Execution error');
    });

    it('should prevent access to global objects', async () => {
      const maliciousCode = `
        function customValidation(data) {
          try {
            process.exit(1); // Should be blocked
          } catch (e) {
            return { isValid: false, message: 'Access denied: ' + e.message };
          }
        }
      `;

      const result = await service.executeValidation(
        maliciousCode,
        mockExecutionData,
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Access denied');
    });

    it('should handle timeout for infinite loops', async () => {
      const infiniteLoopCode = `
        function customValidation(data) {
          while (true) {
            // Infinite loop - should timeout
          }
          return { isValid: true, message: 'Never reached' };
        }
      `;

      const result = await service.executeValidation(
        infiniteLoopCode,
        mockExecutionData,
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('timeout');
    }, 2000);

    it('should sanitize error messages', async () => {
      const codeWithSensitiveInfo = `
        function customValidation(data) {
          throw new Error('Error in /home/user/file.js: 192.168.1.1 - user@example.com');
        }
      `;

      const result = await service.executeValidation(
        codeWithSensitiveInfo,
        mockExecutionData,
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('[path]');
      expect(result.message).toContain('[ip]');
      expect(result.message).toContain('[email]');
    });

    it('should allow safe additional properties', async () => {
      const validationCode = `
        function customValidation(data) {
          return { 
            isValid: true, 
            message: 'Valid', 
            additionalData: 'extra info',
            count: 42,
            nested: {
              value: 'safe',
              numbers: [1, 2, 3]
            }
          };
        }
      `;

      const result = await service.executeValidation(
        validationCode,
        mockExecutionData,
      );

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Valid');
      expect(result.data.additionalData).toBe('extra info');
      expect(result.data.count).toBe(42);
      expect(result.data.nested).toEqual({
        value: 'safe',
        numbers: [1, 2, 3],
      });
    });
  });
});
