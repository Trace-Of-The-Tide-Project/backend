import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { PersonProfile } from './person-profile.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'biographical_cards' })
export class BiographicalCard extends Model<BiographicalCard> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => PersonProfile)
  @Column(DataType.UUID)
  declare person_profile_id: string;

  @Column(DataType.TEXT)
  declare summary: string;

  @Column(DataType.STRING)
  declare image: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @BelongsTo(() => PersonProfile)
  declare personProfile: PersonProfile;

  @BelongsTo(() => User)
  declare creator: User;
}
