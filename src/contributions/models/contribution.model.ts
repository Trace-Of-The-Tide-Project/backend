import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
  AfterUpdate,
  AfterCreate,
  AfterDestroy,
} from 'sequelize-typescript';
import { ContributionType } from './contribution-type.model';
import { User } from '../../users/models/user.model';
import { File } from '../../files/models/file.model';
import { CollectionContribution } from '../../collections/models/collection-contribution.model';
import { Collection } from 'src/collections/models/collection.model';
import { ActivityLogger } from '../../common/utils/activity-logger';

@Table({ tableName: 'contributions' })
export class Contribution extends Model<Contribution> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @ForeignKey(() => ContributionType)
  @Column(DataType.UUID)
  declare type_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare user_id: string;

  @Column(DataType.DATE)
  declare submission_date: Date;

  @Column(DataType.STRING)
  declare status: string;

  // Guest contributor fields (for non-logged-in users)
  @Column({ type: DataType.STRING, allowNull: true })
  declare contributor_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare contributor_email: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare contributor_phone: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare phone_number: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare consent_given: boolean;

  // Optional FK to OpenCall (for contributions linked to an open call)
  @Column({ type: DataType.UUID, allowNull: true })
  declare open_call_id: string;

  // Associations
  @BelongsTo(() => ContributionType)
  declare type: ContributionType;

  @BelongsToMany(() => Collection, () => CollectionContribution)
  declare collections: Collection[];

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => File)
  declare files: File[];

  @HasMany(() => CollectionContribution)
  declare collectionContributions: CollectionContribution[];

  // Sequelize Hooks
  @AfterCreate
  static async afterCreateHook(instance: Contribution) {
    await ActivityLogger.logAction(
      instance.user_id,
      'CREATE',
      'Contribution',
      instance.id,
      instance,
    );
    await ActivityLogger.recordAudit(
      instance.user_id,
      'CREATE',
      'Contribution',
      instance.id,
      { created: instance },
    );
  }

  @AfterUpdate
  static async afterUpdateHook(instance: Contribution) {
    await ActivityLogger.logAction(
      instance.user_id,
      'UPDATE',
      'Contribution',
      instance.id,
      instance,
    );
    await ActivityLogger.recordAudit(
      instance.user_id,
      'UPDATE',
      'Contribution',
      instance.id,
      { updated: instance },
    );
  }

  @AfterDestroy
  static async afterDestroyHook(instance: Contribution) {
    await ActivityLogger.logAction(
      instance.user_id,
      'DELETE',
      'Contribution',
      instance.id,
      {},
    );
    await ActivityLogger.recordAudit(
      instance.user_id,
      'DELETE',
      'Contribution',
      instance.id,
      { deleted: true },
    );
  }
}
