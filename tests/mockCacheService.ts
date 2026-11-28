/* istanbul ignore file */
import { ICacheService } from '../src/services/interfaces/ICacheService';

// In-memory stand-in so service tests never touch Redis.
// Every call is a cache miss unless a test overrides it.
export const createMockCacheService = (): jest.Mocked<ICacheService> => ({
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockRejectedValue(new Error('Cache not found')),
  delete: jest.fn().mockResolvedValue(1),
});
