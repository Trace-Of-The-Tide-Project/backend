import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'books' })
export class Book extends Model<Book> {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @Column({ allowNull: false })
    declare title: string;

    @Column(DataType.STRING)
    declare author: string;

    @Column(DataType.DATE)
    declare published_date: Date;

    @Column(DataType.TEXT)
    declare summary: string;

    @Column(DataType.STRING)
    declare cover_image: string;

    @ForeignKey(() => User)
    @Column(DataType.UUID)
    declare created_by: string;

    @BelongsTo(() => User)
    declare creator: User;
}
