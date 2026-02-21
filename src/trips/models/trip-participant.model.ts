import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Trip } from './trip.model';
import { User } from '../../users/models/user.model';
import { Donation } from '../../donations/models/donation.model';

@Table({ tableName: 'trip_participants' })
export class TripParticipant extends Model<TripParticipant> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Trip)
  @Column({ type: DataType.UUID, allowNull: false })
  declare trip_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  // 'registered' | 'confirmed' | 'waitlisted' | 'cancelled'
  @Column({ type: DataType.STRING, defaultValue: 'registered' })
  declare status: string;

  // 'participant' | 'guide' | 'organizer'
  @Column({ type: DataType.STRING, defaultValue: 'participant' })
  declare role: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare registered_at: Date;

  // Link to donation if trip required payment
  @ForeignKey(() => Donation)
  @Column(DataType.UUID)
  declare donation_id: string;

  @Column(DataType.TEXT)
  declare notes: string;

  @BelongsTo(() => Trip)
  declare trip: Trip;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Donation)
  declare donation: Donation;
}