import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Contribution } from '../../contributions/models/contribution.model';

@Table({ tableName: 'references', timestamps: false })
export class Reference extends Model<Reference> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Contribution)
  @Column(DataType.UUID)
  declare contribution_id: string;

  @Column({ type: DataType.STRING })
  declare title: string;

  @Column({ type: DataType.STRING })
  declare type: string; // e.g., "book", "article", "link"

  @Column({ type: DataType.STRING })
  declare url: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare created_at: Date;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;
}
