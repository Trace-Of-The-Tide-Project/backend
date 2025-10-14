import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Group } from './group.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'group_members' })
export class GroupMember extends Model<GroupMember> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Group)
  @Column(DataType.UUID)
  declare group_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @Column({ type: DataType.STRING, defaultValue: 'member' })
  declare role: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare joined_at: Date;

  @BelongsTo(() => Group)
  declare group: Group;

  @BelongsTo(() => User)
  declare user: User;
}
