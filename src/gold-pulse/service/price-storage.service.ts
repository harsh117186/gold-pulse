import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LivePriceServiceImpl } from './live-price.service.impl';
import { FetchLivePriceResponseDto } from '../dto/fetch-live-price.response.dto';

@Injectable()
export class PriceStorageService implements OnModuleInit {
  private readonly logger = new Logger(PriceStorageService.name);
  private updateInterval: NodeJS.Timeout | null = null;
  private latestPrices: FetchLivePriceResponseDto = {
    gold: 0,
    silver: 0
  };

  constructor(private readonly livePriceService: LivePriceServiceImpl) {}

  async onModuleInit() {
    // Try to get initial prices
    await this.updatePrices();
  }

  async startUpdating() {
    if (this.updateInterval) {
      return;
    }

    // Initial update
    await this.updatePrices();

    // Update every 3 seconds
    this.updateInterval = setInterval(async () => {
      await this.updatePrices();
    }, 3000);

    this.logger.log('MCX price update service started');
  }

  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.logger.log('MCX price update service stopped');
    }
  }

  private async updatePrices() {
    try {
      const mcxData = await this.livePriceService.getMCXGoldAndSilverPrice();
      this.latestPrices = mcxData;
      this.logger.debug('Updated MCX prices:', mcxData);
    } catch (error) {
      this.logger.error('Failed to update MCX prices:', error.message);
    }
  }

  async getLatestPrices(): Promise<FetchLivePriceResponseDto | null> {
    try {
      // Try to get fresh prices first
      try {
        const freshData = await this.livePriceService.getMCXGoldAndSilverPrice();
        this.latestPrices = freshData;
        return freshData;
      } catch (fetchError) {
        // If fetching fresh data fails, return stored prices
        this.logger.warn('Failed to fetch fresh MCX prices, returning stored prices');
        
        // If stored prices are zeros, try to start updates
        if (this.latestPrices.gold === 0 && this.latestPrices.silver === 0) {
          this.startUpdating();
        }
        
        return this.latestPrices;
      }
    } catch (error) {
      this.logger.error('Failed to get MCX prices:', error.message);
      return null;
    }
  }
} 