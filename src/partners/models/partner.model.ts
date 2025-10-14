import {
    Table,
    Column,
    Model,
    DataType,
    HasMany,
} from 'sequelize-typescript';
import { Donation } from '../../donations/models/donation.model';

@Table({ tableName: 'partners' })
export class Partner extends Model<Partner> {
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
    declare contact_info: string;

    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    declare created_at: Date;

    @HasMany(() => Donation)
    declare donations: Donation[];
}
