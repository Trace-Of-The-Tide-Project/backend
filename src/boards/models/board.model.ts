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
import { BoardPage } from './board-page.model';
import { BoardMember } from './board-member.model';
import { BoardChat } from './board-chat.model';
import { BoardTemplate } from './board-template.model';

@Table({ tableName: 'boards' })
export class Board extends Model<Board> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.STRING)
  declare cover_image: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare owner_id: string;

  @Column({ type: DataType.UUID, allowNull: true })
  declare team_id: string;

  // 'active' | 'archived'
  @Column({ type: DataType.STRING, defaultValue: 'active' })
  declare status: string;

  // 'private' | 'team' | 'public'
  @Column({ type: DataType.STRING, defaultValue: 'private' })
  declare visibility: string;

  // JSON: { grid: boolean, minimap: boolean, background_color: string }
  @Column(DataType.TEXT)
  declare settings: string;

  @ForeignKey(() => BoardTemplate)
  @Column({ type: DataType.UUID, allowNull: true })
  declare template_id: string;

  @BelongsTo(() => User, 'owner_id')
  declare owner: User;

  @BelongsTo(() => BoardTemplate)
  declare template: BoardTemplate;

  @HasMany(() => BoardPage)
  declare pages: BoardPage[];

  @HasMany(() => BoardMember)
  declare members: BoardMember[];

  @HasMany(() => BoardChat)
  declare chats: BoardChat[];
}
