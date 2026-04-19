import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(private readonly sequelize: Sequelize) {}

  async onApplicationBootstrap() {
    await this.addColumnIfNotExists(
      'users',
      'password_changed_at',
      'TIMESTAMP',
    );
    await this.addColumnIfNotExists(
      'articles',
      'magazine_id',
      'UUID REFERENCES magazines(id) ON DELETE SET NULL',
    );
    await this.addColumnIfNotExists(
      'articles',
      'issue_id',
      'UUID REFERENCES magazine_issues(id) ON DELETE SET NULL',
    );
  }

  private async addColumnIfNotExists(
    table: string,
    column: string,
    definition: string,
  ) {
    try {
      await this.sequelize.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${definition};`,
      );
      this.logger.log(`Ensured column exists: ${table}.${column}`);
    } catch (err) {
      this.logger.error(
        `Failed to add column ${table}.${column}: ${err.message}`,
      );
    }
  }
}
