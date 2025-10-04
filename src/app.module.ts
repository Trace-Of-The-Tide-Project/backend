// app.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// feature modules
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { ContributionsModule } from './contributions/contributions.module';
import { FilesModule } from './files/files.module';
import { CollectionsModule } from './collections/collections.module';

// models
import { User } from './users/models/user.model';
import { Role } from './roles/models/role.model';
import { UserRole } from './users/models/user-role.model';
import { UserProfile } from './users/models/user-profile.model';
import { Contribution } from './contributions/models/contribution.model';
import { CollectionContribution } from './collections/models/collection-contribution.model';
import { File } from './files/models/file.model';
import { ContributionType } from './contributions/models/contribution-type.model';
import { Collection } from './collections/models/collection.model';


@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'hikaya_user',
      password: '123456789**Sql',
      database: 'hikaya_db',
      models: [
        User,
        Role,
        UserRole,
        UserProfile,
        Contribution,
        CollectionContribution,
        File,
        ContributionType,
        Collection
      ],
      autoLoadModels: true,
      synchronize: true,

      logging: console.log,
    }),
    SequelizeModule.forFeature([User, Role, UserRole]),
    UsersModule,
    AuthModule,
    RolesModule,
    ContributionsModule,
    FilesModule,
    CollectionsModule,
  ],
  controllers: [],
  providers: [
    // Add any global providers here
  ],
})
export class AppModule { }
