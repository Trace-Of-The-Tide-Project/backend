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
import { OpenCall } from './open-call.model';
import { Contribution } from '../../contributions/models/contribution.model';
import { File } from '../../files/models/file.model';

@Table({ tableName: 'participants' })
export class Participant extends Model<Participant> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
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

  // Join form fields from UI designs
  @Column({ type: DataType.STRING, allowNull: true })
  declare first_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare last_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare phone_number: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare experience_field: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare about: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare country: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare city: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare terms_agreed: boolean;

  // Dynamic form answers (JSON — matches the open call's application_form)
  @Column({ type: DataType.JSON, allowNull: true })
  declare form_answers: any;

  // Associations
  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => OpenCall)
  declare open_call: OpenCall;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;

  @HasMany(() => File)
  declare files: File[];
}
