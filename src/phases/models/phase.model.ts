import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Collective } from '../../collectives/models/collective.model';

@Table({ tableName: 'phases' })
export class Phase extends Model<Phase> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Collective)
  @Column({ type: DataType.UUID, allowNull: false })
  declare collective_id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column(DataType.TEXT)
  declare description: string;

  // 'planned' | 'active' | 'completed'
  @Column({ type: DataType.STRING, defaultValue: 'planned' })
  declare status: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare start_date: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare end_date: string;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  declare order: number;

  @BelongsTo(() => Collective)
  declare collective: Collective;
}
