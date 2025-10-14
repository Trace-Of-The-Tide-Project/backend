import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Collective } from './collective.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'collective_members' })
export class CollectiveMember extends Model<CollectiveMember> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Collective)
  @Column(DataType.UUID)
  declare collective_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @Column({ type: DataType.STRING, defaultValue: 'member' })
  declare role: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare joined_at: Date;

  @BelongsTo(() => Collective)
  declare collective: Collective;

  @BelongsTo(() => User)
  declare user: User;
}
