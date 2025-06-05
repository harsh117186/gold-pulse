import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { FetchFutureMcxResponseDto } from '../dto/fetch-future-mcx-contract.response.dto';

interface MCXFutureItem {
  token: string;
  name: string;
  expiry: string;
  exch_seg: string;
  instrumenttype: string;
}

@Injectable()
export class FetchMCXFuturesService {
  private readonly logger = new Logger(FetchMCXFuturesService.name);
  private readonly url: string;

  constructor() {
    const mcxTokenUrl = process.env.ANGEL_FETCH_MCX_TOKEN;
    if (!mcxTokenUrl) {
      throw new Error('ANGEL_FETCH_MCX_TOKEN environment variable is not set');
    }
    this.url = mcxTokenUrl;
  }

  private async fetchFuturesByName(
    name: string,
  ): Promise<FetchFutureMcxResponseDto[]> {
    try {
      const response = await axios.get<MCXFutureItem[]>(this.url);
      const filteredFutures = response.data
        .filter(
          (item: MCXFutureItem) =>
            item.name === name &&
            item.exch_seg === 'MCX' &&
            item.instrumenttype === 'FUTCOM',
        )
        .map((item: MCXFutureItem): FetchFutureMcxResponseDto => ({
          token: item.token,
          name: item.name,
          expiry: item.expiry,
        }));

      this.logger.log(
        `Fetched ${filteredFutures.length} ${name} futures contracts.`,
      );
      return filteredFutures;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.logger.error(
        `Failed to fetch ${name} futures:`,
        error.message || 'Unknown error',
      );
      throw error;
    }
  }

  async fetchGoldFutures(): Promise<FetchFutureMcxResponseDto[]> {
    return this.fetchFuturesByName('GOLD');
  }

  async fetchSilverFutures(): Promise<FetchFutureMcxResponseDto[]> {
    return this.fetchFuturesByName('SILVER');
  }
}
