import {
    Table,
    Column,
    Model,
    DataType,
    HasMany,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';
import { CollectiveMember } from './collective-member.model';

@Table({ tableName: 'collectives' })
export class Collective extends Model<Collective> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    declare id: string;

    @Column({ type: DataType.STRING, allowNull: false, unique: true })
    declare name: string;

    @Column(DataType.TEXT)
    declare description: string;

    @ForeignKey(() => User)
    @Column(DataType.UUID)
    declare created_by: string;

    @BelongsTo(() => User)
    declare creator: User;

    @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
    declare created_at: Date;

    @HasMany(() => CollectiveMember)
    declare members: CollectiveMember[];
}
