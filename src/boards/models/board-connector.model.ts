import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BoardPage } from './board-page.model';
import { BoardElement } from './board-element.model';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'board_connectors' })
export class BoardConnector extends Model<BoardConnector> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => BoardPage)
  @Column({ type: DataType.UUID, allowNull: false })
  declare page_id: string;

  @ForeignKey(() => BoardElement)
  @Column({ type: DataType.UUID, allowNull: false })
  declare source_element_id: string;

  @ForeignKey(() => BoardElement)
  @Column({ type: DataType.UUID, allowNull: false })
  declare target_element_id: string;

  // 'straight' | 'curved' | 'elbow'
  @Column({ type: DataType.STRING, defaultValue: 'straight' })
  declare connector_type: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare start_arrow: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare end_arrow: boolean;

  // JSON: { stroke_color, stroke_width, label }
  @Column(DataType.TEXT)
  declare properties: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare created_by: string;

  @BelongsTo(() => BoardPage)
  declare page: BoardPage;

  @BelongsTo(() => BoardElement, { foreignKey: 'source_element_id', as: 'source' })
  declare source: BoardElement;

  @BelongsTo(() => BoardElement, { foreignKey: 'target_element_id', as: 'target' })
  declare target: BoardElement;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;
}
