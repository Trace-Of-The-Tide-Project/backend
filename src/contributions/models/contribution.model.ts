import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { ContributionType } from './contribution-type.model';
import { User } from '../../users/models/user.model';
import { File } from '../../files/models/file.model';
import { CollectionContribution } from '../../collections/models/collection-contribution.model';
import { Collection } from 'src/collections/models/collection.model';

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
  @Column(DataType.UUID)
  declare user_id: string;

  @Column(DataType.DATE)
  declare submission_date: Date;

  @Column(DataType.STRING)
  declare status: string;

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
}
