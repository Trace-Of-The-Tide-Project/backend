import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'board_templates' })
export class BoardTemplate extends Model<BoardTemplate> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column(DataType.TEXT)
  declare description: string;

  @Column(DataType.STRING)
  declare thumbnail: string;

  // 'editorial' | 'planning' | 'analysis' | 'general'
  @Column(DataType.STRING)
  declare category: string;

  // JSON: full board snapshot { pages: [{ elements: [...], connectors: [...] }], settings: {...} }
  @Column({ type: DataType.TEXT, allowNull: false })
  declare template_data: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare is_system: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: string;

  @BelongsTo(() => User, 'created_by')
  declare creator: User;
}
