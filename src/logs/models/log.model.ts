import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'logs' })
export class Log extends Model<Log> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare action: string;

  @Column(DataType.STRING)
  declare entity_type: string;

  @Column(DataType.UUID)
  declare entity_id: string;

  @Column(DataType.TEXT)
  declare details: string;

  @BelongsTo(() => User)
  declare user: User;
}
