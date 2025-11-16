import { ConfigService } from '@nestjs/config';

/**
 * Factory function to create a mock ConfigService
 * Includes common methods used in the application
 *
 * @example
 * const mockConfigService = createMockConfigService();
 * mockConfigService.get.mockReturnValue('http://localhost:3000');
 *
 * @returns Partial mock ConfigService with jest functions
 */
export function createMockConfigService(): Partial<ConfigService> {
  return {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };
}
