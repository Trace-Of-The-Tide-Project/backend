import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const host = process.env.POSTGRES_HOST;
  const isUnixSocket = host?.startsWith('/');
  const needsSsl = host?.includes('neon.tech') || process.env.POSTGRES_SSL === 'true';

  return {
    dialect: 'postgres',
    ...(isUnixSocket
      ? { host: host, dialectOptions: { socketPath: host } }
      : { host, port: parseInt(process.env.POSTGRES_PORT || '5432', 10) }),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    autoLoadModels: true,
    synchronize: true,
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    dialectOptions: needsSsl
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  };
});
