import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from './models/refresh-tokens.model';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';

@Injectable()
export class TokenService {
  constructor() {}

  async createRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const hashed = await bcrypt.hash(token, 10);

    await RefreshToken.destroy({
      where: {
        user_id: userId,
        expires_at: { [Op.lt]: new Date() },
      },
    });

    await RefreshToken.create({
      user_id: userId,
      token: hashed,
      expires_at: this.addDays(30),
    } as any);

    return token;
  }

 
  async verifyAndConsumeRefreshToken(
    token: string,
  ): Promise<RefreshToken | null> {
    const tokens = await RefreshToken.findAll({
      where: {
        expires_at: { [Op.gt]: new Date() },
      },
    });

    for (const t of tokens) {
      const match = await bcrypt.compare(token, t.token);
      if (match) {
        return t;
      }
    }
    return null;
  }

  async revokeRefreshToken(userId: string, token?: string) {
    if (token) {
      // Revoke specific token
      const tokens = await RefreshToken.findAll({
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
      // Revoke all tokens for this user
      await RefreshToken.destroy({ where: { user_id: userId } });
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    const deleted = await RefreshToken.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() },
      },
    });
    return deleted;
  }

  private addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}