import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'fraud_flags' })
export class FraudFlag extends Model<FraudFlag> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  // 'multiple_failed_payments' | 'unusual_amount' | 'rapid_transactions' | 'suspicious_account' | 'chargeback'
  @Column({ type: DataType.STRING, allowNull: false })
  declare flag_type: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  // Reference to the related entity (donation_id, payout_id, etc)
  @Column(DataType.UUID)
  declare reference_id: string;

  @Column(DataType.STRING)
  declare reference_type: string;

  @Column({ type: DataType.DECIMAL(10, 2) })
  declare amount: number;

  // 'open' | 'investigating' | 'resolved' | 'blocked'
  @Column({ type: DataType.STRING, defaultValue: 'open' })
  declare status: string;

  // 'low' | 'medium' | 'high' | 'critical'
  @Column({ type: DataType.STRING, defaultValue: 'medium' })
  declare severity: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare resolved_by: string;

  @Column(DataType.TEXT)
  declare resolution_notes: string;

  @Column(DataType.DATE)
  declare resolved_at: Date;

  @BelongsTo(() => User, 'user_id')
  declare suspect: User;

  @BelongsTo(() => User, 'resolved_by')
  declare resolver: User;
}