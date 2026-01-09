import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';

interface NombaAuthResponse {
  data: {
    access_token: string;
    expires_in: number;
  };
  success: boolean;
  message: string;
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
    status: string;
    amount: number;
    orderReference: string;
    customerEmail: string;
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private nombaClient: AxiosInstance;

  constructor() {
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
    const errorData = axiosError.response?.data || axiosError.message;

    this.logger.error(context, errorData);
    throw new InternalServerErrorException(context);
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await axios.post<NombaAuthResponse>(
        `${process.env.NOMBA_BASE_URL}/auth/login`,
        {
          clientId: process.env.NOMBA_CLIENT_ID,
          clientSecret: process.env.NOMBA_PRIVATE_KEY,
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

  async verifyPayment(orderReference: string): Promise<NombaVerifyResponse> {
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
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Payment verification failed');
    }
  }
}
