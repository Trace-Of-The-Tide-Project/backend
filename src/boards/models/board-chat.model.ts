import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Board } from './board.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'board_chats' })
export class BoardChat extends Model<BoardChat> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Board)
  @Column({ type: DataType.UUID, allowNull: false })
  declare board_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare sender_id: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  // 'text' | 'system'
  @Column({ type: DataType.STRING, defaultValue: 'text' })
  declare message_type: string;

  @BelongsTo(() => Board)
  declare board: Board;

  @BelongsTo(() => User, 'sender_id')
  declare sender: User;
}
