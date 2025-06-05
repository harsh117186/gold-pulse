import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketPriceService } from './service/market-price.service';

@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  providers: [MarketPriceService],
  exports: [MarketPriceService]
})
export class AppModule {} 