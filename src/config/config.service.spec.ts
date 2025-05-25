import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ApiConfigDto } from '../common/dto/api-config.dto';

describe('ConfigService', () => {
  let service: ConfigService;

  const validConfigDto: ApiConfigDto = {
    name: 'test-api',
    method: 'POST',
    body: {
      email: '',
      username: '',
    },
    customValidation: `function customValidation(data) {
      const { email, username } = data.body;
      if (!email) {
        return { isValid: false, message: 'Email is required' };
      }
      if (!username) {
        return { isValid: false, message: 'Username is required' };
      }
      return { isValid: true, message: 'Data is valid' };
    }`,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveConfig', () => {
    it('should save a valid configuration', async () => {
      const config = await service.saveConfig(validConfigDto);
      expect(config).toBeDefined();
      expect(config.name).toBe(validConfigDto.name);
      expect(config.method).toBe(validConfigDto.method);
      expect(config.body).toEqual(validConfigDto.body);
      expect(config.customValidation).toBe(validConfigDto.customValidation);
    });

    it('should throw ConflictException for duplicate names', async () => {
      await service.saveConfig(validConfigDto);
      await expect(service.saveConfig(validConfigDto)).rejects.toThrow(
        "API configuration 'test-api' already exists",
      );
    });

    it('should throw ConflictException for invalid function syntax', async () => {
      const invalidConfig = {
        ...validConfigDto,
        customValidation: 'invalid function syntax',
      };

      await expect(service.saveConfig(invalidConfig)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException for function without required return format', async () => {
      const invalidConfig = {
        ...validConfigDto,
        customValidation: `function customValidation(data) {
          return { 
            success: true,
            message: 'Missing isValid property',
            details: { foo: 'bar' }
          };
        }`,
      };

      await expect(service.saveConfig(invalidConfig)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getConfig', () => {
    it('should retrieve an existing configuration', async () => {
      await service.saveConfig(validConfigDto);

      const result = await service.getConfig('test-api');
      expect(result).toEqual(validConfigDto);
    });

    it('should throw NotFoundException for non-existent config', async () => {
      await expect(service.getConfig('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllConfigs', () => {
    it('should return empty array when no configs exist', async () => {
      const result = await service.getAllConfigs();
      expect(result).toEqual([]);
    });

    it('should return all saved configurations', async () => {
      await service.saveConfig(validConfigDto);
      await service.saveConfig({
        ...validConfigDto,
        name: 'test-api-2',
      });

      const result = await service.getAllConfigs();
      expect(result).toHaveLength(2);
    });
  });

  describe('deleteConfig', () => {
    it('should delete an existing configuration', async () => {
      await service.saveConfig(validConfigDto);

      await service.deleteConfig('test-api');
      expect(await service.configExists('test-api')).toBe(false);
    });

    it('should throw NotFoundException when deleting non-existent config', async () => {
      await expect(service.deleteConfig('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getConfigCount', () => {
    it('should return correct count of configurations', async () => {
      expect(service.getConfigCount()).toBe(0);

      await service.saveConfig(validConfigDto);
      expect(service.getConfigCount()).toBe(1);

      await service.saveConfig({
        ...validConfigDto,
        name: 'test-api-2',
      });
      expect(service.getConfigCount()).toBe(2);
    });
  });
});
