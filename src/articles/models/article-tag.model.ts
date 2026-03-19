import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Article } from './article.model';
import { Tag } from '../../tags/models/tag.model';

@Table({ tableName: 'article_tags' })
export class ArticleTag extends Model<ArticleTag> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Article)
  @Column({ type: DataType.UUID, allowNull: false })
  declare article_id: string;

  @ForeignKey(() => Tag)
  @Column({ type: DataType.UUID, allowNull: false })
  declare tag_id: string;
}
