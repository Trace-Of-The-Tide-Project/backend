import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  autoLoadModels: true,
  synchronize: true,
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
  dialectOptions: process.env.POSTGRES_HOST?.includes('neon.tech')
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
}));
