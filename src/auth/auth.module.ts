import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { TokenService } from './token.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { RefreshToken } from './models/refresh-tokens.model';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    SequelizeModule.forFeature([RefreshToken]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, TokenService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}