import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'payouts' })
export class Payout extends Model<Payout> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare creator_id: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amount: number;

  @Column({ type: DataType.STRING, defaultValue: 'USD' })
  declare currency: string;

  // 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed'
  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  declare status: string;

  // Payment method info (bank, paypal, etc)
  @Column(DataType.STRING)
  declare payment_method: string;

  @Column(DataType.TEXT)
  declare payment_details: string;

  @Column(DataType.TEXT)
  declare rejection_reason: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare reviewed_by: string;

  @Column(DataType.DATE)
  declare reviewed_at: Date;

  @Column(DataType.DATE)
  declare completed_at: Date;

  @BelongsTo(() => User, { foreignKey: 'creator_id', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'reviewed_by', as: 'reviewer' })
  declare reviewer: User;
}