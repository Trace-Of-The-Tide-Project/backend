import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'message_templates' })
export class MessageTemplate extends Model<MessageTemplate> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  // 'onboarding' | 'payment' | 'moderation' | 'broadcast' | 'notification' | 'general'
  @Column({ type: DataType.STRING, defaultValue: 'general' })
  declare category: string;

  @Column(DataType.STRING)
  declare subject: string;

  // Supports {{name}}, {{email}}, {{role}}, {{date}} variables
  @Column({ type: DataType.TEXT, allowNull: false })
  declare body: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare usage_count: number;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;
}
