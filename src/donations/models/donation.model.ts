import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { Partner } from '../../partners/models/partner.model';

@Table({ tableName: 'donations' })
export class Donation extends Model<Donation> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id: string;

    @ForeignKey(() => User)
    @Column(DataType.UUID)
    declare user_id: string;

    @ForeignKey(() => Partner)
    @Column(DataType.UUID)
    declare partner_id: string;

    @Column(DataType.DECIMAL)
    declare amount: number;

    @Column(DataType.STRING)
    declare type: string; // e.g., "one-time" | "monthly"

    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    declare date: Date;

    @Column({ type: DataType.STRING, defaultValue: 'completed' })
    declare status: string; // e.g., "completed" | "pending"

    @BelongsTo(() => User)
    declare user: User;

    @BelongsTo(() => Partner)
    declare partner: Partner;
}
