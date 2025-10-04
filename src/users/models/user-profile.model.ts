import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'user_profiles' })
export class UserProfile extends Model<UserProfile> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, unique: true })
  user_id: string;

  @Column(DataType.STRING)
  avatar: string;

  @Column(DataType.STRING)
  display_name: string;

  @Column(DataType.DATE)
  birth_date: Date;

  @Column(DataType.STRING)
  gender: string;

  @Column(DataType.STRING)
  location: string;

  @Column(DataType.TEXT)
  about: string;

  @Column(DataType.TEXT)
  social_links: string;

  @BelongsTo(() => User)
  user: User;
}
