import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user.model';

@Table({ tableName: 'writer_profiles' })
export class WriterProfile extends Model<WriterProfile> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  // One-to-one with User — only registered users can be writers
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  declare user_id: string;

  // Optional pen name (overrides display name on publications)
  @Column({ type: DataType.STRING, allowNull: true })
  declare pen_name: string;

  // Short bio shown on writer card (e.g. "Cultural critic and essayist")
  @Column({ type: DataType.STRING, allowNull: true })
  declare headline: string;

  // Long-form biography for the writer's dedicated profile page
  @Column(DataType.TEXT)
  declare bio_long: string;

  // Avatar / portrait image URL
  @Column({ type: DataType.STRING, allowNull: true })
  declare avatar_url: string;

  // Show this writer on the "Voices of our Writers" homepage strip
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare featured: boolean;

  // Social links (twitter, instagram, website, etc.)
  @Column({ type: DataType.JSONB, allowNull: true })
  declare social_links: object;

  @BelongsTo(() => User)
  declare user: User;
}
