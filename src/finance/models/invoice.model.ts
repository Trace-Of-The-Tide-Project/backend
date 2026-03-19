import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Donation } from '../../donations/models/donation.model';

@Table({ tableName: 'invoices' })
export class Invoice extends Model<Invoice> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  // Auto-generated: INV-20240115-001
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare invoice_number: string;

  // 'donation' | 'payout' | 'platform_fee'
  @Column({ type: DataType.STRING, allowNull: false })
  declare type: string;

  @ForeignKey(() => Donation)
  @Column(DataType.UUID)
  declare donation_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare payer_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare payee_id: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare amount: number;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare platform_fee: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare net_amount: number;

  @Column({ type: DataType.STRING, defaultValue: 'USD' })
  declare currency: string;

  // 'draft' | 'issued' | 'paid' | 'cancelled'
  @Column({ type: DataType.STRING, defaultValue: 'issued' })
  declare status: string;

  @Column(DataType.DATE)
  declare issued_at: Date;

  @Column(DataType.DATE)
  declare paid_at: Date;

  @Column(DataType.TEXT)
  declare notes: string;

  @BelongsTo(() => Donation, 'donation_id')
  declare donation: Donation;

  @BelongsTo(() => User, { foreignKey: 'payer_id', as: 'payer' })
  declare payer: User;

  @BelongsTo(() => User, { foreignKey: 'payee_id', as: 'payee' })
  declare payee: User;
}
