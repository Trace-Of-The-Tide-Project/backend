import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'adventures' })
export class Adventure extends Model<Adventure> {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @Column({ allowNull: false })
    declare title: string;

    @Column(DataType.TEXT)
    declare description: string;

    @Column(DataType.DATE)
    declare start_date: Date;

    @Column(DataType.DATE)
    declare end_date: Date;

    @ForeignKey(() => User)
    @Column(DataType.UUID)
    declare created_by: string;

    @BelongsTo(() => User)
    declare creator: User;
}
