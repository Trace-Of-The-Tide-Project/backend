import { TokenService } from './token.service';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';

jest.mock('bcrypt');

describe('TokenService', () => {
  let service: TokenService;
  let mockRefreshTokenModel: any;

  beforeEach(() => {
    mockRefreshTokenModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      destroy: jest.fn(),
    };

    service = new TokenService(mockRefreshTokenModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createRefreshToken ────────────────────────────────────

  describe('createRefreshToken', () => {
    it('should create a refresh token and return the raw token', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      mockRefreshTokenModel.destroy.mockResolvedValue(0);
      mockRefreshTokenModel.findAll.mockResolvedValue([]);
      mockRefreshTokenModel.create.mockResolvedValue({});

      const result = await service.createRefreshToken('user-uuid-1');

      expect(typeof result).toBe('string');
      expect(result).toHaveLength(128); // 64 random bytes → 128 hex chars
      expect(mockRefreshTokenModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-uuid-1',
          token: 'hashed-token',
        }),
      );
    });

    it('should clean up expired tokens before creating new one', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockRefreshTokenModel.destroy.mockResolvedValue(2);
      mockRefreshTokenModel.findAll.mockResolvedValue([]);
      mockRefreshTokenModel.create.mockResolvedValue({});

      await service.createRefreshToken('user-uuid-1');

      // First destroy call is for expired tokens
      expect(mockRefreshTokenModel.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 'user-uuid-1',
          }),
        }),
      );
    });

    it('should limit active tokens to 5 per user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockRefreshTokenModel.destroy.mockResolvedValue(0);

      // Simulate 6 active tokens
      const activeTokens = Array.from({ length: 6 }, (_, i) => ({
        id: `token-${i}`,
        toJSON: () => ({ id: `token-${i}` }),
      }));
      mockRefreshTokenModel.findAll.mockResolvedValue(activeTokens);
      mockRefreshTokenModel.create.mockResolvedValue({});

      await service.createRefreshToken('user-uuid-1');

      // Should delete oldest tokens (6 - 4 = 2 tokens to remove)
      expect(mockRefreshTokenModel.destroy).toHaveBeenCalledTimes(2); // expired + overflow
    });
  });

  // ─── verifyAndConsumeRefreshToken ──────────────────────────

  describe('verifyAndConsumeRefreshToken', () => {
    it('should return matching token record', async () => {
      const candidate = { id: 'tok-1', token: 'hashed', user_id: 'user-1', destroy: jest.fn() };
      mockRefreshTokenModel.findAll.mockResolvedValue([candidate]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyAndConsumeRefreshToken('raw-token');

      expect(result).toEqual(candidate);
    });

    it('should return null when no token matches', async () => {
      mockRefreshTokenModel.findAll.mockResolvedValue([
        { id: 'tok-1', token: 'hashed1' },
        { id: 'tok-2', token: 'hashed2' },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.verifyAndConsumeRefreshToken('bad-token');

      expect(result).toBeNull();
    });

    it('should only search non-expired tokens', async () => {
      mockRefreshTokenModel.findAll.mockResolvedValue([]);

      await service.verifyAndConsumeRefreshToken('any-token');

      expect(mockRefreshTokenModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expires_at: expect.any(Object),
          }),
        }),
      );
    });
  });

  // ─── revokeRefreshToken ────────────────────────────────────

  describe('revokeRefreshToken', () => {
    it('should destroy all tokens for user when no specific token given', async () => {
      mockRefreshTokenModel.destroy.mockResolvedValue(3);

      await service.revokeRefreshToken('user-uuid-1');

      expect(mockRefreshTokenModel.destroy).toHaveBeenCalledWith({
        where: { user_id: 'user-uuid-1' },
      });
    });

    it('should destroy only the matching token when specific token given', async () => {
      const mockToken = { id: 'tok-1', token: 'hashed', destroy: jest.fn() };
      mockRefreshTokenModel.findAll.mockResolvedValue([mockToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.revokeRefreshToken('user-uuid-1', 'raw-token');

      expect(mockToken.destroy).toHaveBeenCalled();
    });
  });

  // ─── cleanupExpiredTokens ──────────────────────────────────

  describe('cleanupExpiredTokens', () => {
    it('should destroy all expired tokens across all users', async () => {
      mockRefreshTokenModel.destroy.mockResolvedValue(5);

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(mockRefreshTokenModel.destroy).toHaveBeenCalledWith({
        where: expect.objectContaining({
          expires_at: expect.any(Object),
        }),
      });
    });
  });
});
