import { Injectable, Logger } from '@nestjs/common';
import { SmartAPI } from 'smartapi-javascript';
import axios from 'axios';
import * as notp from 'notp';
import { FetchMCXResponseDto } from '../dto/fetch-mcx.response.dto';
import { FetchValidGoldAndSilverTokenServiceImpl } from '../service/fetch-valid-goldAndSilver-token.service.impl';
import {
  getSelectedContract
} from '../utility/selected-contracts.utility';

const base32Decode = require('base32-decode');

@Injectable()
export class AngelOneInteractionServiceImpl {
  private readonly logger = new Logger(AngelOneInteractionServiceImpl.name);

  constructor(
    private readonly goldTokenService: FetchValidGoldAndSilverTokenServiceImpl,
  ) {}

  private generateOtp(): string {
    const decodedSecret = base32Decode(process.env.TOTP_SECRET, 'RFC4648');
    return notp.totp.gen(Buffer.from(decodedSecret));
  }

  private async loginAndGetToken(): Promise<string> {
    const clientCode = process.env.CLIENT_CODE;
    const mpin = process.env.MPIN;
    const apiKey = process.env.API_KEY;

    if (!clientCode || !mpin || !apiKey) {
      throw new Error('Required environment variables (CLIENT_CODE, MPIN, API_KEY) are not set');
    }

    const otp = this.generateOtp();
    const smartApi = new SmartAPI({
      api_key: apiKey,
    });

    try {
      const session = await smartApi.generateSession(
        clientCode,
        mpin,
        otp,
      );
      this.logger.log('✅ Logged in successfully');
      return session.data.jwtToken;
    } catch (err: any) {
      this.logger.error('❌ Login failed:', err.message || err);
      throw err;
    }
  }

  private async refreshToken(): Promise<string | undefined> {
    try {
      const jwtToken = await this.loginAndGetToken();
      this.logger.log('Token refreshed successfully');
      return jwtToken;
    } catch (err) {
      this.logger.error('Failed to refresh token', err);
    }
  }

  async fetchMarketData(): Promise<FetchMCXResponseDto | undefined> {
    const jwtToken = await this.refreshToken();
    if (!jwtToken) {
      this.logger.warn('No JWT token available, skipping fetch');
      return;
    }

    const apiKey = process.env.API_KEY;
    const angelOneUrl = process.env.ANGEL_ONE_URL;

    if (!apiKey || !angelOneUrl) {
      this.logger.error('Required environment variables (API_KEY, ANGEL_ONE_URL) are not set');
      return;
    }

    // ✅ Use stored tokens
    const { goldToken: selectedGold, silverToken: selectedSilver } =
      getSelectedContract();

    const exchangeTokens = {
      MCX: [selectedGold, selectedSilver],
    };

    const payload = {
      mode: 'LTP',
      exchangeTokens,
    };

    const headers = {
      Authorization: `Bearer ${jwtToken}`,
      'X-PrivateKey': apiKey,
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00:00:00:00:00:00',
      'X-UserType': 'USER',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(
        angelOneUrl,
        payload,
        { headers },
      );

      const fetched = response.data?.data?.fetched;
      if (!fetched) {
        this.logger.error(
          '❌ Unexpected response structure',
          JSON.stringify(response.data),
        );
        return;
      }

      const gold =
        fetched.find((item: any) => item.symbolToken === selectedGold)?.ltp ??
        0.0;
      const silver =
        fetched.find((item: any) => item.symbolToken === selectedSilver)
          ?.ltp ?? 0.0;

      const obj: FetchMCXResponseDto = {
        gold: gold,
        silver: silver,
      };

      return obj;
    } catch (error: any) {
      if (error.response) {
        this.logger.error('Error response:', error.response.data);
        this.logger.error('Status code:', error.response.status);
        if (error.response.status === 401) {
          this.logger.warn(
            'JWT token expired or invalid, refreshing token...',
          );
          await this.refreshToken();
        }
      } else {
        this.logger.error('Error message:', error.message);
      }
    }
  }
}
