import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BoardPage } from './board-page.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'board_elements' })
export class BoardElement extends Model<BoardElement> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => BoardPage)
  @Column({ type: DataType.UUID, allowNull: false })
  declare page_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare created_by: string;

  // 'sticky_note' | 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'text' | 'image' | 'article_block' | 'layout_grid'
  @Column({ type: DataType.STRING, allowNull: false })
  declare element_type: string;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  declare x: number;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  declare y: number;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 200 })
  declare width: number;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 200 })
  declare height: number;

  @Column({ type: DataType.FLOAT, defaultValue: 0 })
  declare rotation: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare z_index: number;

  @Column(DataType.TEXT)
  declare content: string;

  // JSON: type-specific data
  // sticky_note: { color, font_size }
  // rectangle/circle/triangle/diamond: { fill_color, stroke_color, stroke_width, opacity }
  // text: { font_family, font_size, font_weight, text_align, color }
  // image: { url, alt, object_fit }
  // article_block: { title, subtitle, body, accent_color, cover_image }
  // layout_grid: { rows, columns, gap }
  @Column(DataType.TEXT)
  declare properties: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare is_locked: boolean;

  @BelongsTo(() => BoardPage)
  declare page: BoardPage;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;
}
