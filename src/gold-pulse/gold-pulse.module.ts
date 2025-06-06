import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LivePriceController } from './controller/live-price.controller';
import { UpdateMcxTokenController } from './controller/update-mcx-token.controller';
import { FetchMcxTokensController } from './controller/fetch-mcx-tokens.controller';
import { MarketPriceController } from './controller/market-price.controller';
import { AngelOneInteractionServiceImpl } from './interaction/angel-one.interaction.service.impl';
import { LivePriceServiceImpl } from './service/live-price.service.impl';
import { CronServiceImpl } from './service/cron.service.impl';
import { FetchValidGoldAndSilverTokenServiceImpl } from './service/fetch-valid-goldAndSilver-token.service.impl';
import { FetchMCXFuturesService } from './service/fetch-mcx-futures.service.impl';
import { MarketPriceService } from './service/market-price.service';
import { PriceStorageService } from './service/price-storage.service';

@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  controllers: [
    LivePriceController,
    UpdateMcxTokenController,
    FetchMcxTokensController,
    MarketPriceController
  ],
  providers: [
    LivePriceServiceImpl,
    AngelOneInteractionServiceImpl,
    CronServiceImpl,
    FetchValidGoldAndSilverTokenServiceImpl,
    FetchMCXFuturesService,
    MarketPriceService,
    PriceStorageService
  ],
  exports: [MarketPriceService]
})
export class GoldPulseModule {}
