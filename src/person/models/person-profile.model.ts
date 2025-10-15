import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  HasMany,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { BiographicalCard } from './biographical-card.model';
import { LifeEvent } from './life-event.model';
import { TimelineEvent } from './timeline-event.model';

@Table({ tableName: 'person_profiles' })
export class PersonProfile extends Model<PersonProfile> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column(DataType.STRING)
  declare full_name: string;

  @Column(DataType.DATE)
  declare birth_date: Date;

  @Column(DataType.DATE)
  declare death_date: Date;

  @Column(DataType.TEXT)
  declare biography: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @BelongsTo(() => User)
  declare creator: User;

  @HasMany(() => BiographicalCard)
  declare biographicalCards: BiographicalCard[];

  @HasMany(() => LifeEvent)
  declare lifeEvents: LifeEvent[];

  @HasMany(() => TimelineEvent)
  declare timelineEvents: TimelineEvent[];
}
