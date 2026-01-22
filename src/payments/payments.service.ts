import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, SubscriptionStatus, PaymentStatus } from '@prisma/client';
import { add } from 'date-fns';
import { SUBSCRIPTION_PLANS } from './plans.constants';

interface NombaAuthResponse {
  data: {
    access_token: string;
    expires_in: number;
  };
  success: boolean;
  message: string;
}

interface NombaWebhookPayload {
  data: {
    orderReference: string;
    customerEmail: string;
    status: string;
  };
  event: string;
}

interface NombaOrderResponse {
  code: string;
  description: string;
  data: {
    orderReference: string;
    checkoutLink: string;
  };
}

interface NombaVerifyResponse {
  code: string;
  description: string;
  data: {
    results: Array<{
      status: string;
      amount: string;
      orderReference: string;
      customerEmail: string;
      timeCreated: string;
    }>;
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private nombaClient: AxiosInstance;

  constructor(private prisma: PrismaService) {
    this.nombaClient = axios.create({
      baseURL: process.env.NOMBA_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        accountId: process.env.NOMBA_ACCOUNT_ID,
      },
    });
  }

  private handleAxiosError(error: unknown, context: string): never {
    const axiosError = error as AxiosError;
    // Log the full error for debugging
    this.logger.error(`${context} - Status: ${axiosError.response?.status}`);
    this.logger.error(
      JSON.stringify(axiosError.response?.data || axiosError.message, null, 2),
    );

    throw new InternalServerErrorException(context);
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await axios.post<NombaAuthResponse>(
        `${process.env.NOMBA_BASE_URL}/auth/token/issue`,
        {
          grant_type: 'client_credentials',
          client_id: process.env.NOMBA_CLIENT_ID,
          client_secret: process.env.NOMBA_PRIVATE_KEY,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            accountId: process.env.NOMBA_ACCOUNT_ID,
          },
        },
      );

      return response.data.data.access_token;
    } catch (error) {
      this.handleAxiosError(
        error,
        'Could not authenticate with Payment Gateway',
      );
    }
  }

  async createPaymentOrder(paymentData: {
    amount: number;
    email: string;
    currency: string;
    callbackUrl: string;
  }): Promise<NombaOrderResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const payload = {
        order: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          customerEmail: paymentData.email,
          description: 'Subscription Payment',
        },
        callbackUrl: paymentData.callbackUrl,
      };

      const response = await this.nombaClient.post<NombaOrderResponse>(
        '/checkout/order',
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Payment initialization failed');
    }
  }

  async verifyPayment(orderReference: string): Promise<{
    data: { status: string; amount: number; orderReference: string };
  }> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.nombaClient.get<NombaVerifyResponse>(
        `/checkout/transaction?orderReference=${orderReference}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const results = response.data.data?.results;
      const transaction =
        Array.isArray(results) && results.length > 0 ? results[0] : null;

      if (!transaction) {
        throw new BadRequestException(
          'Transaction not found in payment gateway',
        );
      }

      return {
        data: {
          status: transaction.status,
          amount: parseFloat(transaction.amount),
          orderReference: transaction.orderReference,
        },
      };
    } catch (error) {
      this.handleAxiosError(error, 'Payment verification failed');
    }
  }

  async verifyAndActivateSubscription(
    orderReference: string,
    userEmail: string,
  ) {
    const verification = await this.verifyPayment(orderReference);

    if (verification.data.status !== 'SUCCESS') {
      throw new BadRequestException(
        'Payment verification failed or payment was not successful',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
      include: { talentProfile: true, employerProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const amountPaid = verification.data.amount;
    const allPlans = [
      ...SUBSCRIPTION_PLANS.TALENT,
      ...SUBSCRIPTION_PLANS.EMPLOYER,
    ];

    const plan = allPlans.find((p) => p.price === Number(amountPaid));

    if (!plan) {
      this.logger.warn(
        `Payment verified for ${amountPaid} but no matching plan found.`,
      );
      throw new InternalServerErrorException(
        'Payment amount does not match any active plan',
      );
    }

    const startDate = new Date();
    const endDate = add(startDate, { days: 365 });

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          userType: user.role,
          tier: plan.id.toUpperCase(),
          amount: plan.price,
          currency: plan.currency,
          startDate,
          endDate,
          status: SubscriptionStatus.ACTIVE,
          isRecurring: true,
          paymentReference: orderReference,
          lastPaymentDate: new Date(),
          nextPaymentDate: endDate,
        },
      });

      await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: plan.currency,
          status: PaymentStatus.COMPLETED,
          nombaReference: orderReference,
          paidAt: new Date(),
          paymentMethod: 'NOMBA_CHECKOUT',
        },
      });

      if (user.role === UserRole.TALENT) {
        await tx.talentProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            subscriptionId: subscription.id,
            firstName: '',
            lastName: '',
            location: '',
          },
          update: { subscriptionId: subscription.id },
        });
      } else if (user.role === UserRole.EMPLOYER) {
        await tx.employerProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            subscriptionId: subscription.id,
            companyName: '',
            industry: '',
            companySize: '',
            location: '',
          },
          update: { subscriptionId: subscription.id },
        });
      }

      return { success: true, subscription };
    });
  }

  async processWebhook(payload: NombaWebhookPayload) {
    this.logger.log(`Webhook received: ${JSON.stringify(payload)}`);

    const orderReference = payload.data?.orderReference;
    const email = payload.data?.customerEmail;

    if (!orderReference || !email) {
      this.logger.warn('Webhook received but missing reference or email');
      return { status: 'ignored', message: 'Missing reference or email' };
    }

    try {
      const result = await this.verifyAndActivateSubscription(
        orderReference,
        email,
      );
      this.logger.log(`Webhook processed successfully for ${email}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook processing failed: ${errorMessage}`);
      return { status: 'failed', error: errorMessage };
    }
  }

  async initiateSubscription(userEmail: string, planId: string) {
    const allPlans = [
      ...SUBSCRIPTION_PLANS.TALENT,
      ...SUBSCRIPTION_PLANS.EMPLOYER,
    ];
    const plan = allPlans.find((p) => p.id === planId);

    if (!plan) {
      throw new InternalServerErrorException('Invalid plan selected');
    }

    if (plan.price === 0) {
      return {
        paymentRequired: false,
        message: 'Free plan activated successfully',
      };
    }

    const callbackUrl = `${process.env.FRONTEND_URL}/dashboard?payment_verify=true`;

    const nombaOrder = await this.createPaymentOrder({
      amount: plan.price,
      currency: plan.currency,
      email: userEmail,
      callbackUrl: callbackUrl,
    });

    return {
      paymentRequired: true,
      checkoutLink: nombaOrder.data.checkoutLink,
      orderReference: nombaOrder.data.orderReference,
    };
  }
}
