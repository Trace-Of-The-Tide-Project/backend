import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'site_settings' })
export class SiteSettings extends Model<SiteSettings> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  // Unique key: 'navigation', 'footer', 'branding', or any custom key
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare key: string;

  // JSON value storing the full config:
  // navigation: { links: [{ label, url, order, is_visible }] }
  // footer: { text, social_links: { twitter, instagram, linkedin } }
  // branding: { logo, favicon, primary_color }
  @Column({ type: DataType.TEXT, allowNull: false })
  declare value: string;
}
