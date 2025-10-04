import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Contribution } from './contribution.model';

@Table({ tableName: 'contribution_types' })
export class ContributionType extends Model<ContributionType> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string;

  @HasMany(() => Contribution)
  declare contributions: Contribution[];
}
