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
import { Message } from './message.model';

@Table({ tableName: 'conversations' })
export class Conversation extends Model<Conversation> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare subject: string;

    // 'payment' | 'content' | 'account' | 'technical' | 'general'
    @Column({ type: DataType.STRING, defaultValue: 'general' })
    declare category: string;

    // 'low' | 'normal' | 'high' | 'urgent'
    @Column({ type: DataType.STRING, defaultValue: 'normal' })
    declare priority: string;

    // 'open' | 'pending' | 'resolved' | 'archived'
    @Column({ type: DataType.STRING, defaultValue: 'open' })
    declare status: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false })
    declare user_id: string;

    @ForeignKey(() => User)
    @Column(DataType.UUID)
    declare assigned_to: string;

    @Column(DataType.DATE)
    declare resolved_at: Date;

    @Column(DataType.DATE)
    declare last_message_at: Date;

    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    declare unread_count: number;

    @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
    declare user: User;

    @BelongsTo(() => User, { foreignKey: 'assigned_to', as: 'assignee' })
    declare assignee: User;

    @HasMany(() => Message)
    declare messages: Message[];
}