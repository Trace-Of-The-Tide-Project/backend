import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './models/refresh-tokens.model';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenService {
  constructor(private readonly usersService: UsersService) {}

  async createRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const hashed = await bcrypt.hash(token, 10);
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
    const tokens = await RefreshToken.findAll();
    for (const t of tokens) {
      const match = await bcrypt.compare(token, t.token);
      if (match && new Date(t.expires_at) > new Date()) {
        return t;
      }
    }
    return null;
  }

  async revokeRefreshToken(userId: string, token?: string) {
    if (token) {
      const tokens = await RefreshToken.findAll({ where: { user_id: userId } });
      for (const t of tokens) {
        const match = await bcrypt.compare(token, t.token);
        if (match) {
          await t.destroy();
        }
      }
    } else {
      await RefreshToken.destroy({ where: { user_id: userId } });
    }
  }
  private addDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
