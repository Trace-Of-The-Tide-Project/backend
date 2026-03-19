import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'badges' })
export class Badge extends Model<Badge> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;

  @Column(DataType.TEXT)
  declare description: string;

  // Icon identifier: 'trophy', 'star', 'heart', 'check', 'gear', 'chart'
  @Column({ type: DataType.STRING, defaultValue: 'trophy' })
  declare icon: string;

  // 'contributions' | 'comments' | 'published' | 'verification' | 'custom'
  @Column({ type: DataType.STRING, defaultValue: 'custom' })
  declare criteria_type: string;

  // e.g. 100 for "100+ contributions"
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare criteria_value: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare is_active: boolean;

  // How many users have earned this badge
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare awarded_count: number;
}
