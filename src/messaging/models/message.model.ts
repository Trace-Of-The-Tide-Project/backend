import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Conversation } from './conversation.model';

@Table({ tableName: 'messages' })
export class Message extends Model<Message> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id: string;

    @ForeignKey(() => Conversation)
    @Column({ type: DataType.UUID, allowNull: false })
    declare conversation_id: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false })
    declare sender_id: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare content: string;

    // 'text' | 'template' | 'system'
    @Column({ type: DataType.STRING, defaultValue: 'text' })
    declare message_type: string;

    @Column(DataType.STRING)
    declare attachment_url: string;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    declare is_read: boolean;

    @Column(DataType.DATE)
    declare read_at: Date;

    @BelongsTo(() => Conversation)
    declare conversation: Conversation;

    @BelongsTo(() => User, 'sender_id')
    declare sender: User;
}