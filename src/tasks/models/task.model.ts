import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Article } from '../../articles/models/article.model';
import { Contribution } from '../../contributions/models/contribution.model';
import { OpenCall } from '../../open call/models/open-call.model';

@Table({ tableName: 'tasks' })
export class Task extends Model<Task> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string;

  @Column(DataType.TEXT)
  declare description: string;

  // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  @Column({ type: DataType.STRING, defaultValue: 'pending' })
  declare status: string;

  // 'low' | 'medium' | 'high'
  @Column({ type: DataType.STRING, defaultValue: 'medium' })
  declare priority: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare due_date: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare completed_at: Date;

  // Who is assigned to do the task
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare assignee_id: string;

  // Who assigned the task (editor/admin)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare assigner_id: string;

  // Optional linked entities
  @ForeignKey(() => Article)
  @Column({ type: DataType.UUID, allowNull: true })
  declare article_id: string;

  @ForeignKey(() => Contribution)
  @Column({ type: DataType.UUID, allowNull: true })
  declare contribution_id: string;

  @ForeignKey(() => OpenCall)
  @Column({ type: DataType.UUID, allowNull: true })
  declare open_call_id: string;

  @BelongsTo(() => User, 'assignee_id')
  declare assignee: User;

  @BelongsTo(() => User, 'assigner_id')
  declare assigner: User;

  @BelongsTo(() => Article)
  declare article: Article;

  @BelongsTo(() => Contribution)
  declare contribution: Contribution;

  @BelongsTo(() => OpenCall)
  declare openCall: OpenCall;
}
