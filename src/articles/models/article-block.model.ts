import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Article } from './article.model';

@Table({ tableName: 'article_blocks' })
export class ArticleBlock extends Model<ArticleBlock> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Article)
  @Column({ type: DataType.UUID, allowNull: false })
  declare article_id: string;

  // Block order (1, 2, 3...)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare block_order: number;

  // 'paragraph' | 'quote' | 'image' | 'gallery' | 'callout' | 'author_note' | 'divider' | 'video' | 'audio' | 'caption_text' | 'meta_data' | 'statistics'
  @Column({ type: DataType.STRING, allowNull: false })
  declare block_type: string;

  // Main text content (for paragraph, quote, callout, author_note, caption_text)
  @Column(DataType.TEXT)
  declare content: string;

  // JSON metadata specific to block type:
  // - image: { url, alt, caption, width, height }
  // - gallery: { images: [{ url, alt, caption }] }
  // - video: { url, thumbnail, duration, description }
  // - audio: { url, duration, description }
  // - meta_data: { camera, medium, date }
  // - quote: { attribution }
  @Column(DataType.TEXT)
  declare metadata: string;

  @BelongsTo(() => Article)
  declare article: Article;
}
