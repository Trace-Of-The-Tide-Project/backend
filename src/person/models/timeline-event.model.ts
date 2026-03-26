import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { PersonProfile } from './person-profile.model';
import { Contribution } from '../../contributions/models/contribution.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'timeline_events' })
export class TimelineEvent extends Model<TimelineEvent> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column(DataType.STRING)
  declare title: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.DATE)
  declare event_date: Date;

  @ForeignKey(() => PersonProfile)
  @Column(DataType.UUID)
  declare related_person_id: string;

  @ForeignKey(() => Contribution)
  @Column(DataType.UUID)
  declare related_contribution_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @BelongsTo(() => PersonProfile)
  declare personProfile: PersonProfile;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;

  @BelongsTo(() => User)
  declare creator: User;
}
