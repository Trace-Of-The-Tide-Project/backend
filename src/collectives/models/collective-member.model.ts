import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Collective } from './collective.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'collective_members' })
export class CollectiveMember extends Model<CollectiveMember> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Collective)
  @Column(DataType.UUID)
  declare collective_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare user_id: string;

  @Column({ type: DataType.STRING, defaultValue: 'member' })
  declare role: string;

  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  declare status: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare joined_at: Date;

  // Join form fields
  @Column({ type: DataType.STRING, allowNull: true })
  declare first_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare last_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare phone_number: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare experience_field: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare traces: string[];

  @Column({ type: DataType.TEXT, allowNull: true })
  declare about: string;

  // Social media links
  @Column({ type: DataType.STRING, allowNull: true })
  declare facebook: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare twitter: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare instagram: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare linkedin: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare custom_links: string[];

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare terms_agreed: boolean;

  // Availability fields
  @Column({ type: DataType.STRING, allowNull: true })
  declare availability_type: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare availability_days: string[];

  @Column({ type: DataType.JSON, allowNull: true })
  declare availability_slots: Record<string, { start: string; end: string }[]>;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare availability_date: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare availability_timezone: string;

  // Associations
  @BelongsTo(() => Collective)
  declare collective: Collective;

  @BelongsTo(() => User)
  declare user: User;
}
