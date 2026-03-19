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
  declare user_id: string;

  @Column(DataType.STRING)
  declare avatar: string;

  @Column(DataType.STRING)
  declare display_name: string;

  @Column(DataType.DATE)
  declare birth_date: Date;

  @Column(DataType.STRING)
  declare gender: string;

  @Column(DataType.STRING)
  declare location: string;

  @Column(DataType.TEXT)
  declare about: string;

  @Column(DataType.TEXT)
  declare social_links: string;

  @BelongsTo(() => User)
  declare user: User;
}
