import { ObjectLiteral, Repository } from 'typeorm';

/**
 * Type definition for a partial mock repository
 * Useful for testing services that depend on TypeORM repositories
 */
export type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

/**
 * Factory function to create a mock repository
 * Includes common TypeORM methods used in the application
 *
 * @example
 * const mockRepository = createMockRepository<User>();
 * mockRepository.findOne.mockResolvedValue(mockUser);
 *
 * @returns Partial mock repository with jest functions
 */
export function createMockRepository<
  T extends ObjectLiteral = any,
>(): MockRepository<T> {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    preload: jest.fn(),
    softDelete: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    increment: jest.fn(() => ({
      catch: jest.fn(),
    })),
    decrement: jest.fn(),
    count: jest.fn(),
    query: jest.fn(),
    clear: jest.fn(),
  };
}
