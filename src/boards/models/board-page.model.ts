import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Board } from './board.model';
import { BoardElement } from './board-element.model';
import { BoardConnector } from './board-connector.model';

@Table({ tableName: 'board_pages' })
export class BoardPage extends Model<BoardPage> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Board)
  @Column({ type: DataType.UUID, allowNull: false })
  declare board_id: string;

  @Column({ type: DataType.STRING, defaultValue: 'Page 1' })
  declare title: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare page_order: number;

  @BelongsTo(() => Board)
  declare board: Board;

  @HasMany(() => BoardElement)
  declare elements: BoardElement[];

  @HasMany(() => BoardConnector)
  declare connectors: BoardConnector[];
}
