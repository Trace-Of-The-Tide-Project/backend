import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Page } from './page.model';

@Table({ tableName: 'page_sections' })
export class PageSection extends Model<PageSection> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Page)
  @Column({ type: DataType.UUID, allowNull: false })
  declare page_id: string;

  // 'hero' | 'featured' | 'categories' | 'top_creators' | 'call_to_action' | 'custom'
  @Column({ type: DataType.STRING, allowNull: false })
  declare section_type: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  // Display order on the page
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare section_order: number;

  // Visible on the live site?
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare is_visible: boolean;

  // JSON config specific to section type:
  // hero: { headline, subheadline, primary_cta, secondary_cta, background_image }
  // featured: { item_ids: [] }
  // categories: { category_ids: [] }
  // top_creators: { limit: 5 }
  // call_to_action: { text, button_text, button_url }
  @Column(DataType.TEXT)
  declare config: string;

  @BelongsTo(() => Page)
  declare page: Page;
}
