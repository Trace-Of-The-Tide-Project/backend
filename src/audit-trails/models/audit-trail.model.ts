import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'audit_trails' })
export class AuditTrail extends Model<AuditTrail> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare user_id: string;

  @Column(DataType.STRING)
  declare action: string;

  @Column(DataType.STRING)
  declare entity_type: string;

  @Column(DataType.UUID)
  declare entity_id: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare timestamp: Date;

  @Column(DataType.TEXT)
  declare changes: string; // Store JSON string of changed fields

  @BelongsTo(() => User)
  declare user: User;
}
