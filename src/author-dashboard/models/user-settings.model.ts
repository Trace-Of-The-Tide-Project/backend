import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'user_settings' })
export class UserSettings extends Model<UserSettings> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  declare user_id: string;

  // ─── NOTIFICATION PREFERENCES ─────────────────────
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare notify_article_updates: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare notify_new_followers: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare notify_new_contributors: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare notify_comments: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare notify_weekly_digest: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare notify_push_browser: boolean;

  // ─── PRIVACY PREFERENCES ─────────────────────────
  // 'public' | 'private' | 'followers_only'
  @Column({ type: DataType.STRING, defaultValue: 'public' })
  declare profile_visibility: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare show_email: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare show_activity: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare allow_follows: boolean;

  // ─── AVAILABILITY ─────────────────────────────────
  // 'available' | 'busy' | 'away'
  @Column({ type: DataType.STRING, defaultValue: 'available' })
  declare availability_status: string;

  @Column(DataType.TEXT)
  declare availability_message: string;

  @BelongsTo(() => User, 'user_id')
  declare user: User;
}
