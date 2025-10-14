import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Discussion } from '../../discussions/models/discussion.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'comments' })
export class Comment extends Model<Comment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Discussion)
  @Column(DataType.UUID)
  declare discussion_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @ForeignKey(() => Comment)
  @Column(DataType.UUID)
  declare parent_comment_id: string;

  @ForeignKey(() => Comment)
  @Column(DataType.UUID)
  declare thread_root_id: string;

  @Column(DataType.TEXT)
  declare content: string;

  @Column(DataType.INTEGER)
  declare depth: number;

  @BelongsTo(() => Discussion)
  declare discussion: Discussion;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Comment, { foreignKey: 'parent_comment_id', as: 'parent' })
  declare parent: Comment;

  @HasMany(() => Comment, { foreignKey: 'parent_comment_id', as: 'replies' })
  declare replies: Comment[];
}
