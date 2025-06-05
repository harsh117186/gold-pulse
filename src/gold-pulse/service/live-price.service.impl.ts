import {
  readPriceData as globalReadPriceData,
} from '../utility/global.utility';
import { AngelOneInteractionServiceImpl } from '../interaction/angel-one.interaction.service.impl';
import { FetchLivePriceResponseDto } from '../dto/fetch-live-price.response.dto';
import { Inject, Injectable, Logger } from '@nestjs/common';

interface PriceData {
  goldWithoutGst: number;
  silverWithoutGst: number;
 
}

@Injectable()
export class LivePriceServiceImpl {
  private readonly logger = new Logger(LivePriceServiceImpl.name);
  constructor(
    @Inject()
    private readonly angelOneInteractionService: AngelOneInteractionServiceImpl,
  ) {}

  async getMCXGoldAndSilverPrice(): Promise<FetchLivePriceResponseDto> {
    try {
      this.logger.log('Fetching MCX gold and silver price...');
      const response = await this.angelOneInteractionService.fetchMarketData();

      if (!response) {
        throw new Error('Failed to fetch market data');
      }

      // // Calculate prices
      // const goldPrice24Carat = add3PercentGSTToMCXPrice(response.gold);
      // const silverPricePerKG = add3PercentGSTToMCXPrice(response.silver);
      // this.logger.log('Prices calculated successfully');

      // // Calculate 22 Carat and 18 Carat prices
      // const goldPrice22Carat = calculate22CaratPrice(goldPrice24Carat);
      // const goldPrice18Carat = calculate18CaratPrice(goldPrice24Carat);
      // this.logger.log('22 Carat and 18 Carat prices calculated successfully');

      // // Update price data in file
      // await updatePriceData(
      //   response.gold,
      //   response.silver,
      //   // goldPrice24Carat,
      //   // silverPricePerKG,
      //   // goldPrice22Carat,
      //   // goldPrice18Carat,
      // );

      const result: FetchLivePriceResponseDto = {
        gold: response.gold,
        silver: response.silver,
        // goldPrice24Carat,
        // silverPricePerKG,
        // goldPrice22Carat,
        // goldPrice18Carat,
      };

      this.logger.log('Object created successfully', JSON.stringify(result));
      return result;
    } catch (err) {
      const error = err as Error;
      this.logger.error('Failed to fetch market data:', error.message);
      throw error;
    }
  }

  async readPriceData(): Promise<FetchLivePriceResponseDto | null> {
    try {
      return await globalReadPriceData();
    } catch (error) {
      const err = error as Error;
      this.logger.error('❌ Failed to read price data:', err.message);
      return null;
    }
  }
}
