import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Trip } from './trip.model';
import { Location } from '../../knowledge/models/location.model';

@Table({ tableName: 'trip_stops' })
export class TripStop extends Model<TripStop> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Trip)
  @Column({ type: DataType.UUID, allowNull: false })
  declare trip_id: string;

  @ForeignKey(() => Location)
  @Column(DataType.UUID)
  declare location_id: string;

  // Stop order in the trip route (1, 2, 3...)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare stop_order: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column(DataType.TEXT)
  declare description: string;

  // Scheduled arrival at this stop
  @Column(DataType.DATE)
  declare arrival_time: Date;

  // How long to spend at this stop (in minutes)
  @Column(DataType.INTEGER)
  declare duration_minutes: number;

  @Column(DataType.STRING)
  declare cover_image: string;

  @BelongsTo(() => Trip)
  declare trip: Trip;

  @BelongsTo(() => Location)
  declare location: Location;
}