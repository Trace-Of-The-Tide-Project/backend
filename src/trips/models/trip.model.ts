import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { TripStop } from './trip-stop.model';
import { TripParticipant } from './trip-participant.model';

@Table({ tableName: 'trips' })
export class Trip extends Model<Trip> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.STRING)
  declare cover_image: string;

  // e.g. 'cultural', 'historical', 'educational', 'heritage'
  @Column(DataType.STRING)
  declare category: string;

  // Route summary shown on TripCard (e.g. "Jerusalem → Bethlehem → Hebron")
  @Column(DataType.STRING)
  declare route_summary: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare start_date: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare end_date: Date;

  // Price in USD — null means free
  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 0 })
  declare price: number;

  @Column(DataType.STRING)
  declare currency: string;

  // Max number of participants — null means unlimited
  @Column(DataType.INTEGER)
  declare max_participants: number;

  // 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  @Column({ type: DataType.STRING, defaultValue: 'draft' })
  declare status: string;

  // Difficulty level: 'easy' | 'moderate' | 'challenging'
  @Column(DataType.STRING)
  declare difficulty: string;

  // Estimated duration in hours
  @Column(DataType.FLOAT)
  declare duration_hours: number;

  // JSON array of tags e.g. ["heritage", "walking", "photography"]
  @Column(DataType.TEXT)
  declare tags: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare created_by: string;

  @BelongsTo(() => User)
  declare creator: User;

  @HasMany(() => TripStop)
  declare stops: TripStop[];

  @HasMany(() => TripParticipant)
  declare participants: TripParticipant[];
}