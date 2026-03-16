import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { CollectionContribution } from './collection-contribution.model';
import { Contribution } from '../../contributions/models/contribution.model';
import { Article } from '../../articles/models/article.model';

@Table({ tableName: 'collections' })
export class Collection extends Model<Collection> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.STRING)
  declare cover_image: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @BelongsTo(() => User)
  declare creator: User;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare created_date: Date;

  @BelongsToMany(() => Contribution, () => CollectionContribution)
  declare contributions: Contribution[];

  @HasMany(() => CollectionContribution)
  declare collectionContributions: CollectionContribution[];

  @HasMany(() => Article)
  declare articles: Article[];
}
