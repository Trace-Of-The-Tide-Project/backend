import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(private readonly sequelize: Sequelize) {}

  async onApplicationBootstrap() {
    try {
      await this.sequelize.sync({ alter: true });
      this.logger.log('Schema synced with alter: true');
    } catch (err) {
      this.logger.error(`Schema sync failed: ${err.message}`);
    }
  }
}
