import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'knowledge_articles' })
export class KnowledgeArticle extends Model<KnowledgeArticle> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ allowNull: false })
  declare title: string;

  @Column(DataType.TEXT)
  declare content: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare author_id: string;

  @BelongsTo(() => User)
  declare author: User;
}
