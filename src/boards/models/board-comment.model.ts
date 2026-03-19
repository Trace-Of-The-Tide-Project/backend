import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { BoardElement } from './board-element.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'board_comments' })
export class BoardComment extends Model<BoardComment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => BoardElement)
  @Column({ type: DataType.UUID, allowNull: false })
  declare element_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  @ForeignKey(() => BoardComment)
  @Column({ type: DataType.UUID, allowNull: true })
  declare parent_comment_id: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  // 'open' | 'resolved' | 'closed'
  @Column({ type: DataType.STRING, defaultValue: 'open' })
  declare status: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare depth: number;

  @BelongsTo(() => BoardElement)
  declare element: BoardElement;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => BoardComment, {
    foreignKey: 'parent_comment_id',
    as: 'parent',
  })
  declare parent: BoardComment;

  @HasMany(() => BoardComment, {
    foreignKey: 'parent_comment_id',
    as: 'replies',
  })
  declare replies: BoardComment[];
}
