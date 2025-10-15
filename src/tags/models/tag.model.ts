import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { ContributionTag } from './contribution-tag.model';

@Table({ tableName: 'tags' })
export class Tag extends Model<Tag> {
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

  @HasMany(() => ContributionTag)
  declare contributionTags: ContributionTag[];
}
