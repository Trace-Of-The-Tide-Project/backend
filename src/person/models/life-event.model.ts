import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { PersonProfile } from './person-profile.model';
import { Location } from '../../knowledge/models/location.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'life_events' })
export class LifeEvent extends Model<LifeEvent> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => PersonProfile)
  @Column(DataType.UUID)
  declare person_profile_id: string;

  @Column(DataType.STRING)
  declare title: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.DATE)
  declare event_date: Date;

  @ForeignKey(() => Location)
  @Column(DataType.UUID)
  declare location_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @BelongsTo(() => PersonProfile)
  declare personProfile: PersonProfile;

  @BelongsTo(() => User)
  declare creator: User;
}
