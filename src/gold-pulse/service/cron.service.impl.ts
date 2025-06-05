import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LivePriceServiceImpl } from './live-price.service.impl';
import { FetchValidGoldAndSilverTokenServiceImpl } from './fetch-valid-goldAndSilver-token.service.impl';
import { FetchMCXFuturesService } from './fetch-mcx-futures.service.impl';
import {
  setGoldToken,
  setSilverToken,
} from '../utility/selected-contracts.utility';
import {
  setGoldContracts,
  setSilverContracts,
} from '../utility/mcx-contracts.utility';
import { FetchLivePriceResponseDto } from '../dto/fetch-live-price.response.dto';

@Injectable()
export class CronServiceImpl {
  private readonly logger = new Logger(CronServiceImpl.name);

  constructor(
    @Inject()
    private readonly livePriceService: LivePriceServiceImpl,
    private readonly fetchValidGoldTokenService: FetchValidGoldAndSilverTokenServiceImpl,
    private readonly fetchMCXFuturesService: FetchMCXFuturesService,
  ) {}

  @Cron('*/3 * * * * *')
  async handleCron(): Promise<FetchLivePriceResponseDto> {
    this.logger.debug('Cron job triggered');
    try {
      const data = await this.livePriceService.getMCXGoldAndSilverPrice();
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error('Failed to fetch price data:', error.message);
      throw error;
    }
  }

  @Cron('0 3 * * *') // 3:00 AM daily
  async handleDailyTokenUpdate(): Promise<void> {
    this.logger.debug('DailyTokenUpdate job triggered');

    try {
      const [goldToken, silverToken] = await Promise.all([
        this.fetchValidGoldTokenService.getLatestValidGoldToken(),
        this.fetchValidGoldTokenService.getLatestValidSilverToken(),
      ]);

      if (goldToken) {
        await setGoldToken(goldToken);
        this.logger.log(`✅ Set new GOLD token: ${goldToken}`);
      } else {
        this.logger.warn('❌ No valid GOLD token found to set');
      }

      if (silverToken) {
        await setSilverToken(silverToken);
        this.logger.log(`✅ Set new SILVER token: ${silverToken}`);
      } else {
        this.logger.warn('❌ No valid SILVER token found to set');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error('Failed to update tokens:', error.message);
      throw error;
    }
  }

  @Cron('0 2 * * *') // 2:00 AM daily
  async handleFuturesContractRefresh(): Promise<void> {
    this.logger.debug('FuturesContractRefresh job triggered');

    try {
      const [goldContracts, silverContracts] = await Promise.all([
        this.fetchMCXFuturesService.fetchGoldFutures(),
        this.fetchMCXFuturesService.fetchSilverFutures(),
      ]);

      await Promise.all([
        setGoldContracts(goldContracts),
        setSilverContracts(silverContracts),
      ]);

      this.logger.log(`✅ Updated ${goldContracts.length} GOLD contracts`);
      this.logger.log(`✅ Updated ${silverContracts.length} SILVER contracts`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error(
        '❌ Error refreshing MCX futures contracts:',
        error.message,
      );
      throw error;
    }
  }
}
