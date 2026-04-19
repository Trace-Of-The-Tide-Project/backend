import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  TWO_FA_ENABLED = '2fa_enabled',
  TWO_FA_DISABLED = '2fa_disabled',
  ACCOUNT_LOCKED = 'account_locked',
}

@Table({ tableName: 'security_events', timestamps: false })
export class SecurityEvent extends Model<SecurityEvent> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare user_id: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(SecurityEventType)),
    allowNull: false,
  })
  declare event_type: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare ip_address: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare user_agent: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare metadata: any;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare created_at: Date;
}
