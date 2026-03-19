import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'broadcasts' })
export class Broadcast extends Model<Broadcast> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare subject: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare message: string;

  // 'all_users' | 'authors' | 'editors' | 'admins' | 'contributors'
  @Column({ type: DataType.STRING, defaultValue: 'all_users' })
  declare target_audience: string;

  // 'low' | 'normal' | 'high' | 'urgent'
  @Column({ type: DataType.STRING, defaultValue: 'normal' })
  declare priority: string;

  // 'draft' | 'sent' | 'scheduled'
  @Column({ type: DataType.STRING, defaultValue: 'draft' })
  declare status: string;

  @Column(DataType.STRING)
  declare template_id: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare recipients_count: number;

  @Column(DataType.DATE)
  declare sent_at: Date;

  @Column(DataType.DATE)
  declare scheduled_at: Date;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare created_by: string;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;
}
