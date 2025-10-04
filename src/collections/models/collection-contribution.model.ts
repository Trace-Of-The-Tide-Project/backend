import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Collection } from './collection.model';
import { Contribution } from '../../contributions/models/contribution.model';

@Table({ tableName: 'collection_contributions' })
export class CollectionContribution extends Model<CollectionContribution> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Collection)
  @Column(DataType.UUID)
  declare collection_id: string;

  @ForeignKey(() => Contribution)
  @Column(DataType.UUID)
  declare contribution_id: string;

  @Column(DataType.DATE)
  declare added_at: Date;

  @BelongsTo(() => Collection)
  declare collection: Collection;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;
}
