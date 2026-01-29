import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsController } from './subscriptions/subscriptions.controller';
import { PaymentsService } from './payments/payments.service';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, PaymentsModule],
  controllers: [AppController, SubscriptionsController],
  providers: [AppService, PrismaService, PaymentsService],
})
export class AppModule {}
