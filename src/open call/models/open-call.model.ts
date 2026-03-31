import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Participant } from './participant.model';

@Table({ tableName: 'open_calls' })
export class OpenCall extends Model<OpenCall> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column(DataType.STRING)
  declare title: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.STRING)
  declare category: string;

  @Column(DataType.DATE)
  declare timeline_start: Date;

  @Column(DataType.DATE)
  declare timeline_end: Date;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare created_by: string;

  @Column({ type: DataType.STRING, defaultValue: 'open' })
  declare status: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare edition: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare cover_image: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare images: string[];

  @Column({ type: DataType.TEXT, allowNull: true })
  declare body_content: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare author_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare type: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare date: Date;

  // Toolkit / resources for contributors (JSON — guidelines, templates, links)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare toolkit: string;

  // ── New CMS-like fields ──────────────────────────────────

  // Article-like content blocks: [{type, value, order}]
  @Column({ type: DataType.JSON, allowNull: true })
  declare content_blocks: any[];

  // Main media: {type, url, size_mb}
  @Column({ type: DataType.JSON, allowNull: true })
  declare main_media: any;

  // Dynamic application form definition: {fields: [{name, type, required, options?, ...}]}
  @Column({ type: DataType.JSON, allowNull: true })
  declare application_form: any;

  // SEO: {title, meta_description}
  @Column({ type: DataType.JSON, allowNull: true })
  declare seo: any;

  // Tags array
  @Column({ type: DataType.JSON, allowNull: true })
  declare tags: string[];

  // Language: 'en' | 'ar'
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'en' })
  declare language: string;

  // Visibility: 'public' | 'private'
  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'public' })
  declare visibility: string;

  // Scheduled publish date
  @Column({ type: DataType.DATE, allowNull: true })
  declare scheduled_at: Date;

  // Actual publish date
  @Column({ type: DataType.DATE, allowNull: true })
  declare published_at: Date;

  @BelongsTo(() => User)
  declare creator: User;

  @HasMany(() => Participant)
  declare participants: Participant[];
}
