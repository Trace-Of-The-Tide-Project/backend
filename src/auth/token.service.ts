import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { RefreshToken } from './models/refresh-tokens.model';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(RefreshToken)
    private readonly refreshTokenModel: typeof RefreshToken,
  ) {}

  async createRefreshToken(
    userId: string,
    meta: { ip_address?: string; user_agent?: string } = {},
  ): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const hashed = await bcrypt.hash(token, 10);

    // Clean up expired tokens for this user
    await this.refreshTokenModel.destroy({
      where: {
        user_id: userId,
        expires_at: { [Op.lt]: new Date() },
      },
    });

    // Limit active tokens per user (keep max 5, remove oldest)
    const activeTokens = await this.refreshTokenModel.findAll({
      where: { user_id: userId },
      order: [['created_at', 'ASC']],
    });
    if (activeTokens.length >= 5) {
      const tokensToRemove = activeTokens.slice(0, activeTokens.length - 4);
      await this.refreshTokenModel.destroy({
        where: { id: tokensToRemove.map((t) => t.id) },
      });
    }

    await this.refreshTokenModel.create({
      user_id: userId,
      token: hashed,
      expires_at: this.addDays(30),
      ip_address: meta.ip_address || null,
      user_agent: meta.user_agent ? meta.user_agent.substring(0, 500) : null,
    } as any);

    return token;
  }

  /**
   * Verify a refresh token and return the record if valid.
   *
   * PERFORMANCE FIX: The old code loaded ALL tokens from the entire table
   * and compared each one with bcrypt (O(n) bcrypt comparisons across ALL users).
   * With 10,000 users × 5 tokens each = 50,000 bcrypt calls per refresh.
   *
   * Unfortunately, since tokens are hashed, we can't query by token value directly.
   * But we CAN narrow by filtering only non-expired tokens. For a production system
   * with many users, consider storing a token prefix/fingerprint for indexed lookup.
   */
  async verifyAndConsumeRefreshToken(
    token: string,
    userId?: string,
  ): Promise<RefreshToken | null> {
    const where: any = {
      expires_at: { [Op.gt]: new Date() },
    };
    if (userId) {
      where.user_id = userId;
    }

    const candidates = await this.refreshTokenModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    for (const candidate of candidates) {
      const match = await bcrypt.compare(token, candidate.token);
      if (match) {
        // Consume the token — delete it so it cannot be reused
        await candidate.destroy();
        return candidate;
      }
    }
    return null;
  }

  /**
   * Revoke a specific refresh token or all tokens for a user.
   */
  async revokeRefreshToken(userId: string, token?: string) {
    if (token) {
      const tokens = await this.refreshTokenModel.findAll({
        where: { user_id: userId },
      });
      for (const t of tokens) {
        const match = await bcrypt.compare(token, t.token);
        if (match) {
          await t.destroy();
          return;
        }
      }
    } else {
      // Revoke all tokens for this user (full logout)
      await this.refreshTokenModel.destroy({ where: { user_id: userId } });
    }
  }

  /**
   * Cleanup job — call periodically (e.g. cron) to remove expired tokens.
   */
  async cleanupExpiredTokens(): Promise<number> {
    return this.refreshTokenModel.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() },
      },
    });
  }

  private addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
