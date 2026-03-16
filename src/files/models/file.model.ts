import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Contribution } from '../../contributions/models/contribution.model';
import { User } from '../../users/models/user.model';
import { Participant } from '../../open call/models/participant.model';

@Table({ tableName: 'files' })
export class File extends Model<File> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Contribution)
  @Column(DataType.UUID)
  declare contribution_id: string;

  @Column(DataType.STRING)
  declare file_name: string;

  @Column(DataType.STRING)
  declare mime_type: string;

  @Column(DataType.INTEGER)
  declare file_size: number;

  @Column(DataType.STRING)
  declare resolution: string;

  @Column(DataType.STRING)
  declare duration: string;

  @Column(DataType.TEXT)
  declare transcript: string;

  @Column(DataType.STRING)
  declare path: string;

  @ForeignKey(() => Participant)
  @Column({ type: DataType.UUID, allowNull: true })
  declare participant_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare uploaded_by: string;

  @Column(DataType.DATE)
  declare upload_date: Date;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;

  @BelongsTo(() => User)
  declare uploader: User;

  @BelongsTo(() => Participant)
  declare participant: Participant;
}
