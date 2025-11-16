import { Url } from '../../src/urls/entities/url.entity';
import { User } from '../../src/users/entities/user.entity';

/**
 * Factory function to create a mock Url entity
 * Allows easy customization through overrides
 *
 * @example
 * const url = createMockUrl();
 * const customUrl = createMockUrl({ original_url: 'https://example.com' });
 *
 * @param overrides - Partial URL data to override defaults
 * @returns Url entity with default or overridden values
 */
export function createMockUrl(overrides?: Partial<Url>): Url {
  return {
    id: 'url-uuid',
    original_url: 'https://google.com',
    short_code: 'abcdef',
    click_count: 0,
    user: null,
    user_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Url;
}

/**
 * Factory function to create a mock Url with user relation
 * Useful for testing user-specific URL queries
 *
 * @example
 * const user = createMockUser();
 * const url = createMockUrlWithUser(user);
 *
 * @param user - User entity to associate with URL
 * @param overrides - Partial URL data to override defaults
 * @returns Url entity associated with a user
 */
export function createMockUrlWithUser(
  user: User,
  overrides?: Partial<Url>,
): Url {
  return createMockUrl({
    user,
    user_id: user.id,
    ...overrides,
  });
}
