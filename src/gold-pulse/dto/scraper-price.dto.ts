import { IsNotEmpty, IsString } from 'class-validator';

export interface ScrapedPriceDto {
  product: string;
  rate: string;
}

export interface SilverCostingDto {
  costing: string;
  buy: string;
  sell: string;
  high?: string;
  low?: string;
  premium?: string;
  withoutGstPremium?: string;
}

export interface MantraGoldDto {
  product: string;
  buy: string;
  sell: string;
  high: string;
  low: string;
}

export interface ScrapedDataResponseDto {
  deepJewellers: ScrapedPriceDto[];
  pritamSpot: ScrapedPriceDto[];
  aaravSilver: SilverCostingDto[];
  arihantSilver: SilverCostingDto[];
  mantraGold: MantraGoldDto | null;
} 