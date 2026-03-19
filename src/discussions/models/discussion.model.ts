import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Contribution } from '../../contributions/models/contribution.model';
import { Collection } from '../../collections/models/collection.model';
import { Comment } from '../../comments/models/comment.model';

@Table({ tableName: 'discussions' })
export class Discussion extends Model<Discussion> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT })
  declare description: string;

  @Column({
    type: DataType.STRING(20),
    defaultValue: 'open',
    allowNull: false,
  })
  declare status: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @ForeignKey(() => Contribution)
  @Column(DataType.UUID)
  declare related_contribution_id: string;

  @ForeignKey(() => Collection)
  @Column(DataType.UUID)
  declare related_collection_id: string;

  @BelongsTo(() => User)
  declare creator: User;

  @BelongsTo(() => Contribution)
  declare relatedContribution: Contribution;

  @BelongsTo(() => Collection)
  declare relatedCollection: Collection;

  @HasMany(() => Comment)
  declare comments: Comment[];
}
