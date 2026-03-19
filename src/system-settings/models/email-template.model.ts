import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'email_templates' })
export class EmailTemplate extends Model<EmailTemplate> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;

  // 'onboarding' | 'security' | 'content' | 'payment' | 'moderation' | 'general'
  @Column({ type: DataType.STRING, defaultValue: 'general' })
  declare category: string;

  @Column(DataType.STRING)
  declare subject: string;

  // Supports {{name}}, {{email}}, {{role}}, {{date}} variables
  @Column({ type: DataType.TEXT, allowNull: false })
  declare body: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare is_active: boolean;
}
