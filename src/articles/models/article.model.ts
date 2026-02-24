import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { ArticleBlock } from './article-block.model';
import { ArticleContributor } from './article-contributor.model';
import { Tag } from '../../tags/models/tag.model';
import { ArticleTag } from './article-tag.model';

@Table({ tableName: 'articles' })
export class Article extends Model<Article> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  // URL-friendly slug auto-generated from title
  @Column({ type: DataType.STRING, unique: true })
  declare slug: string;

  // 'article' | 'video' | 'audio' | 'thread' | 'artwork' | 'figma' | 'trip' | 'open_call'
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'article' })
  declare content_type: string;

  // Short excerpt for cards and SEO
  @Column(DataType.TEXT)
  declare excerpt: string;

  // Cover image URL
  @Column(DataType.STRING)
  declare cover_image: string;

  // 'draft' | 'published' | 'scheduled' | 'archived' | 'flagged'
  @Column({ type: DataType.STRING, defaultValue: 'draft' })
  declare status: string;

  // Category (e.g., Documentary, Music, Photography, Essay, Experimental)
  @Column(DataType.STRING)
  declare category: string;

  // 'en' | 'ar'
  @Column({ type: DataType.STRING, defaultValue: 'en' })
  declare language: string;

  // 'public' | 'private' | 'unlisted'
  @Column({ type: DataType.STRING, defaultValue: 'public' })
  declare visibility: string;

  // Estimated reading time in minutes
  @Column(DataType.INTEGER)
  declare reading_time: number;

  // View counter
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare view_count: number;

  // SEO fields
  @Column(DataType.STRING)
  declare seo_title: string;

  @Column(DataType.TEXT)
  declare meta_description: string;

  // Scheduled publish date (for status = 'scheduled')
  @Column(DataType.DATE)
  declare scheduled_at: Date;

  @Column(DataType.DATE)
  declare published_at: Date;

  // Author
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare author_id: string;

  @BelongsTo(() => User)
  declare author: User;

  // Block-based content
  @HasMany(() => ArticleBlock)
  declare blocks: ArticleBlock[];

  // Contributors (other users who helped)
  @HasMany(() => ArticleContributor)
  declare contributors: ArticleContributor[];

  // Tags (many-to-many)
  @BelongsToMany(() => Tag, () => ArticleTag)
  declare tags: Tag[];

  @HasMany(() => ArticleTag)
  declare articleTags: ArticleTag[];
}