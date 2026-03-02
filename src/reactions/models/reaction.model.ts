import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Comment } from '../../comments/models/comment.model';

@Table({ tableName: 'reactions', timestamps: false })
export class Reaction extends Model<Reaction> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @ForeignKey(() => Comment)
  @Column(DataType.UUID)
  declare comment_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Type of reaction (like, love, wow, etc.)',
  })
  declare type: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare created_at: Date;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Comment)
  declare comment: Comment;
}
