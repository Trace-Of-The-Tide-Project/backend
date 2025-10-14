import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { OpenCall } from './open-call.model';
import { Contribution } from '../../contributions/models/contribution.model';

@Table({ tableName: 'participants' })
export class Participant extends Model<Participant> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @ForeignKey(() => OpenCall)
  @Column(DataType.UUID)
  declare open_call_id: string;

  @Column(DataType.STRING)
  declare role: string;

  @ForeignKey(() => Contribution)
  @Column(DataType.UUID)
  declare contribution_id: string;

  @Column(DataType.DATE)
  declare join_date: Date;

  @Column(DataType.STRING)
  declare status: string;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => OpenCall)
  declare open_call: OpenCall;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;
}
