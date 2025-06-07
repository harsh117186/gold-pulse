import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export interface BaseMarketPriceDto {
  source: string;
  product: string;
  sell: number;
  buy: number;
  high: number;
  low: number;
  location?: string;
  status?: string;
}

export interface SilverCostingDto {
  costing: string;
  buy: string;
  sell: string;
  high?: string;
  low?: string;
}

export interface MantraGoldDto {
  source: string;
  product: string;
  buy: string;
  sell: string;
  high: string;
  low: string;
}

export interface MarketPriceResponseDto {
  arihantPrices: BaseMarketPriceDto[];
  jkSonsPrices: BaseMarketPriceDto[];
  aaravPrices: BaseMarketPriceDto[];
  kakaPrices: BaseMarketPriceDto[];
  karunaPrices: BaseMarketPriceDto[];
  aaravSilver: SilverCostingDto[];
  arihantSilver: SilverCostingDto[];
  mantraGold: MantraGoldDto | null;
} 