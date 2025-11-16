import { User } from '../../src/users/entities/user.entity';

/**
 * Factory function to create a mock User entity
 * Allows easy customization through overrides
 *
 * @example
 * const user = createMockUser();
 * const customUser = createMockUser({ email: 'custom@example.com' });
 *
 * @param overrides - Partial user data to override defaults
 * @returns User entity with default or overridden values
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-uuid',
    email: 'teste@email.com',
    password: 'password123',
    urls: [],
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}
