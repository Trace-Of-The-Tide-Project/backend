import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Article } from '../../articles/models/article.model';

@Table({ tableName: 'article_view_snapshots' })
export class ArticleViewSnapshot extends Model<ArticleViewSnapshot> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Article)
  @Column({ type: DataType.UUID, allowNull: false })
  declare article_id: string;

  // Which period this snapshot was taken for ('7d', '30d', '90d', '1y')
  @Column({ type: DataType.STRING, allowNull: false })
  declare period: string;

  // Cumulative view_count at the time of the snapshot
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare view_count: number;

  @BelongsTo(() => Article)
  declare article: Article;
}
