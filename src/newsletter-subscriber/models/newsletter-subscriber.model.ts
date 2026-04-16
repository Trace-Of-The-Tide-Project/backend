import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Magazine } from '../../magazine/models/magazine.model';

@Table({ tableName: 'newsletter_subscribers' })
export class NewsletterSubscriber extends Model<NewsletterSubscriber> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Magazine)
  @Column({ type: DataType.UUID, allowNull: false })
  declare magazine_id: string;

  // Case-insensitive; unique per (magazine_id, email) via DB unique constraint
  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string;

  // Null for guest subscribers; set when a registered user subscribes
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare user_id: string;

  // 'pending' | 'confirmed' | 'unsubscribed' | 'bounced'
  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  declare status: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare confirmed_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare unsubscribed_at: Date | null;

  // Which UI element triggered the signup (e.g. 'footer', 'modal', 'landing')
  @Column({ type: DataType.STRING, allowNull: true })
  declare source: string;

  // GDPR-friendly explicit consent timestamp
  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare consent_given_at: Date;

  @BelongsTo(() => Magazine)
  declare magazine: Magazine;

  @BelongsTo(() => User)
  declare user: User;
}
