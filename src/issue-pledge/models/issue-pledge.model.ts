import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { MagazineIssue } from '../../magazine-issue/models/magazine-issue.model';

@Table({ tableName: 'issue_pledges' })
export class IssuePledge extends Model<IssuePledge> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => MagazineIssue)
  @Column({ type: DataType.UUID, allowNull: false })
  declare issue_id: string;

  // Null for guest pledges
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare user_id: string;

  // Guest backer fields (used when user_id is null)
  @Column({ type: DataType.STRING, allowNull: true })
  declare guest_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare guest_email: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare amount: number;

  @Column({ type: DataType.STRING, defaultValue: 'USD' })
  declare currency: string;

  // 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed'
  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  declare status: string;

  // Link to finance.Invoice once payment is captured
  @Column({ type: DataType.UUID, allowNull: true })
  declare invoice_id: string;

  // Reward selected by backer (e.g. 'Print copy', 'Digital')
  @Column({ type: DataType.STRING, allowNull: true })
  declare reward_tier: string;

  // Optional personal note from backer
  @Column(DataType.TEXT)
  declare message: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare captured_at: Date;

  @BelongsTo(() => MagazineIssue)
  declare issue: MagazineIssue;

  @BelongsTo(() => User)
  declare backer: User;
}
