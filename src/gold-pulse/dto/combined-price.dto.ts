import { SilverCostingDto, MantraGoldDto } from './market-price.dto';

export interface CombinedPriceDto {
  timestamp: string;
  aaravSilver: SilverCostingDto[];
  arihantSilver: SilverCostingDto[];
  mantraGold: MantraGoldDto | null;
} 