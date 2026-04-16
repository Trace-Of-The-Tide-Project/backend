import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth/auth.module';
import { NewsletterSubscriber } from './models/newsletter-subscriber.model';
import { NewsletterSubscriberService } from './newsletter-subscriber.service';
import { NewsletterSubscriberController } from './newsletter-subscriber.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    SequelizeModule.forFeature([NewsletterSubscriber]),
  ],
  controllers: [NewsletterSubscriberController],
  providers: [NewsletterSubscriberService],
  exports: [NewsletterSubscriberService],
})
export class NewsletterSubscriberModule {}
