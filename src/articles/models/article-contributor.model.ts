import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Article } from './article.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'article_contributors' })
export class ArticleContributor extends Model<ArticleContributor> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Article)
  @Column({ type: DataType.UUID, allowNull: false })
  declare article_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare user_id: string;

  // 'main_contributor' | 'co-author' | 'contributor' | 'editor' | 'reviewer'
  @Column({ type: DataType.STRING, defaultValue: 'contributor' })
  declare role: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare added_at: Date;

  @BelongsTo(() => Article)
  declare article: Article;

  @BelongsTo(() => User)
  declare user: User;
}
