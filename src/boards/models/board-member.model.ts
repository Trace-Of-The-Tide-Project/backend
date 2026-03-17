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

@Table({ tableName: 'board_members' })
export class BoardMember extends Model<BoardMember> {
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
  declare user_id: string;

  // 'owner' | 'editor' | 'commenter' | 'viewer'
  @Column({ type: DataType.STRING, defaultValue: 'viewer' })
  declare role: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare joined_at: Date;

  @BelongsTo(() => Board)
  declare board: Board;

  @BelongsTo(() => User)
  declare user: User;
}
