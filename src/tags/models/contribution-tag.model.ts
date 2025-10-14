import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Contribution } from '../../contributions/models/contribution.model';
import { Tag } from './tag.model';

@Table({ tableName: 'contribution_tags' })
export class ContributionTag extends Model<ContributionTag> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Contribution)
  @Column(DataType.UUID)
  declare contribution_id: string;

  @ForeignKey(() => Tag)
  @Column(DataType.UUID)
  declare tag_id: string;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;

  @BelongsTo(() => Tag)
  declare tag: Tag;
}
