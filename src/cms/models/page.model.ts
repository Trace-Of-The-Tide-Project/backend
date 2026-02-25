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
import { PageSection } from './page-section.model';

@Table({ tableName: 'pages' })
export class Page extends Model<Page> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare slug: string;

  // 'homepage' | 'static' | 'custom'
  @Column({ type: DataType.STRING, defaultValue: 'static' })
  declare page_type: string;

  // Rich text / HTML content (for static pages like About, FAQ, Terms)
  @Column(DataType.TEXT)
  declare content: string;

  // 'draft' | 'published'
  @Column({ type: DataType.STRING, defaultValue: 'draft' })
  declare status: string;

  // SEO
  @Column(DataType.STRING)
  declare seo_title: string;

  @Column(DataType.TEXT)
  declare meta_description: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare updated_by: string;

  @BelongsTo(() => User)
  declare editor: User;

  @HasMany(() => PageSection)
  declare sections: PageSection[];
}