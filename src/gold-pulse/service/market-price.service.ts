import { Injectable, Logger } from '@nestjs/common';
import { BaseMarketPriceDto, MarketPriceResponseDto, SilverCostingDto, MantraGoldDto, PlatinumCostingDto, PalladiumCostingDto } from '../dto/market-price.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MarketPriceService {
  private readonly logger = new Logger(MarketPriceService.name);
  private silverPriceINR: number = 0;

  constructor(
    private readonly configService: ConfigService
  ) {}

  private async fetchData(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'Accept': 'text/plain, */*; q=0.01',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch data from ${url}:`, error.message);
      throw error;
    }
  }

  private parseArihantData(data: string): BaseMarketPriceDto[] {
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const regex = /(\d+)\s+([A-Za-z0-9\s\(\)\-]+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/;
    
    return lines
      .map(line => {
        const match = line.match(regex);
        if (match && match[2].toUpperCase().includes('GOLD 999')) {
          const price: BaseMarketPriceDto = {
            source: 'Arihant',
            product: match[2].trim(),
            sell: parseFloat(match[4]),
            buy: parseFloat(match[3]),
            high: parseFloat(match[5]),
            low: parseFloat(match[6])
          };
          return price;
        }
        return null;
      })
      .filter((item): item is BaseMarketPriceDto => item !== null);
  }

  private parseJKSonsData(data: string): BaseMarketPriceDto[] {
    const lines = data.split('\n');
    const targetProducts = new Set([
      'GLD 999 IMP AMD',
      'GLD 999 IMP RJT',
      'SLVCHORSA',
      'SLVPETI999'
    ]);

    return lines
      .filter(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 6) return false;
        const productName = parts.slice(1, parts.length - 4).join(' ');
        return targetProducts.has(productName);
      })
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const product = parts.slice(1, parts.length - 4).join(' ');
        const [buy, sell, high, low] = parts.slice(-4).map(Number);

        const price: BaseMarketPriceDto = {
          source: 'JK Sons',
          product: product,
          sell,
          buy,
          high,
          low
        };
        return price;
      });
  }

  private parseAaravData(data: string): BaseMarketPriceDto[] {
    const lines = data.split('\n').map(line => line.trim());
    return lines
      .filter(line => 
        line.includes('GOLD 999')
      )
      .map(line => {
        const parts = line.split(/\s+/);
        const location = parts.slice(1, parts.length - 4).join(' ');
        const [buy, sell, high, low] = parts.slice(-4).map(Number);

        const price: BaseMarketPriceDto = {
          source: 'Aarav',
          product: 'GOLD 999 IMP',
          location,
          sell,
          buy,
          high,
          low
        };
        return price;
      });
  }

  private parseKakaData(data: string): BaseMarketPriceDto[] {
    const lines = data.split('\n').filter(line => line.trim() !== '');
    return lines
      .filter(line => line.includes('GOLD 999 IMP WITH GST'))
      .map(line => {
        const parts = line.split(/\s+/).filter(part => part.trim() !== '');
        if (parts.length >= 5) {
          const location = parts.slice(1, parts.length - 4).join(' ');
          const [buy, sell, high, low] = parts.slice(-4).map(Number);

          const price: BaseMarketPriceDto = {
            source: 'Kaka',
            product: 'GOLD 999 IMPORTED',
            location,
            sell,
            buy,
            high,
            low
          };
          return price;
        }
        return null;
      })
      .filter((item): item is BaseMarketPriceDto => item !== null);
  }

  private parseKarunaData(data: string): BaseMarketPriceDto[] {
    const lines = data.split('\n').map(line => line.trim());
    return lines
      .filter(line =>
        line.includes('GOLD 999') ||
        line.includes('SILVER PETI')
      )
      .map(line => {
        const parts = line.split(/\s+/);
        const product = parts.slice(1, parts.length - 5).join(' ');
        const [buy, sell, high, low] = parts.slice(-5, -1).map(Number);
        const status = parts[parts.length - 1];

        const price: BaseMarketPriceDto = {
          source: 'Karuna',
          product,
          sell,
          buy,
          high,
          low,
          status
        };
        return price;
      });
  }

  private async fetchAaravSilver(): Promise<SilverCostingDto[]> {
    try {
      const data = await this.fetchData('https://bcast.aaravbullion.in/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/aaravsilver');
      const lines: string[] = data.split('\n').map((line: string) => line.trim());
      
      return lines
        .filter((line: string) => line.includes('2171'))
        .map((line: string) => {
          const parts = line.split(/\s+/);
          const [costing, buy, sell, high, low] = parts.slice(-5);

          return {
            costing,
            buy,
            sell,
            high,
            low
          };
        });
    } catch (error) {
      return [];
    }
  }

  private async fetchArihantSilver(): Promise<SilverCostingDto[]> {
    try {
      const data = await this.fetchData('https://bcast.arihantspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/arihantsilver');
      const lines: string[] = data.split('\n').map((line: string) => line.trim());
      
      return lines
        .filter((line: string) => line.includes('SILVER (PREMIUM)'))
        .map((line: string) => {
          const parts = line.split(/\s+/);
          const [costing, buy, sell, high, low] = parts.slice(-5);

          return {
            costing,
            buy,
            sell,
            high,
            low
          };
        });
    } catch (error) {
      return [];
    }
  }

  private async fetchMantraGold(): Promise<MantraGoldDto | null> {
    try {
      const data = await this.fetchData('http://bcast.mantragold.net:7767/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/mantragold');
      const lines: string[] = data.split('\n').map((line: string) => line.trim());
      
      const goldGstLine = lines.find((line: string) => line.includes('GOLD 999 WITH GST'));
      if (!goldGstLine) return null;

      // Split by whitespace and filter out empty strings
      const parts = goldGstLine.split(/\s+/).filter(part => part.trim() !== '');
      
      // Find all numeric values in the line, excluding "999" which is part of the product name
      const numericValues = parts
        .filter(part => !isNaN(Number(part)) && part.length > 0 && part !== '999')
        .map(Number)  // Convert to numbers to ensure proper sorting
        .sort((a, b) => a - b)  // Sort numerically
        .map(String);  // Convert back to strings

      if (numericValues.length < 4) {
        this.logger.warn('Not enough numeric values found in Mantra Gold data');
        return null;
      }

      // Get the values in the correct order
      const [low, buy, sell, high] = numericValues.slice(-4);

      return {
        product: 'GOLD 999',
        buy: buy || '0',
        sell: sell || '0',
        high: high || '0',
        low: low || '0'
      };
    } catch (error) {
      this.logger.error('Failed to fetch Mantra Gold data:', error.message);
      return null;
    }
  }

  private async fetchAaravPlatinum(): Promise<PlatinumCostingDto[]> {
    try {
      const data = await this.fetchData('https://bcast.aaravbullion.in/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/aaravplatinum');
      const lines: string[] = data.split('\n').map((line: string) => line.trim());
      
      return lines
        .filter((line: string) => line.includes('PLATINUM'))
        .map((line: string) => {
          const parts = line.split(/\s+/);
          const [costing, buy, sell, high, low] = parts.slice(-5);

          return {
            costing,
            buy,
            sell,
            high,
            low
          };
        });
    } catch (error) {
      return [];
    }
  }

  private async fetchArihantPlatinum(): Promise<PlatinumCostingDto[]> {
    try {
      const data = await this.fetchData('https://bcast.arihantspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/arihantplatinum');
      const lines: string[] = data.split('\n').map((line: string) => line.trim());
      
      return lines
        .filter((line: string) => line.includes('PLATINUM'))
        .map((line: string) => {
          const parts = line.split(/\s+/);
          const [costing, buy, sell, high, low] = parts.slice(-5);

          return {
            costing,
            buy,
            sell,
            high,
            low
          };
        });
    } catch (error) {
      return [];
    }
  }

  private async fetchAaravPalladium(): Promise<PalladiumCostingDto[]> {
    try {
      const data = await this.fetchData('https://bcast.aaravbullion.in/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/aaravpalladium');
      const lines: string[] = data.split('\n').map((line: string) => line.trim());
      
      return lines
        .filter((line: string) => line.includes('PALLADIUM'))
        .map((line: string) => {
          const parts = line.split(/\s+/);
          const [costing, buy, sell, high, low] = parts.slice(-5);

          return {
            costing,
            buy,
            sell,
            high,
            low
          };
        });
    } catch (error) {
      return [];
    }
  }

  private async fetchArihantPalladium(): Promise<PalladiumCostingDto[]> {
    try {
      const data = await this.fetchData('https://bcast.arihantspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/arihantpalladium');
      const lines: string[] = data.split('\n').map((line: string) => line.trim());
      
      return lines
        .filter((line: string) => line.includes('PALLADIUM'))
        .map((line: string) => {
          const parts = line.split(/\s+/);
          const [costing, buy, sell, high, low] = parts.slice(-5);

          return {
            costing,
            buy,
            sell,
            high,
            low
          };
        });
    } catch (error) {
      return [];
    }
  }

  async fetchAllMarketPrices(): Promise<MarketPriceResponseDto> {
    try {
      const [
        arihantData,
        jkSonsData,
        aaravData,
        kakaData,
        karunaData
      ] = await Promise.all([
        this.fetchData('https://bcast.arihantspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/arihantgold'),
        this.fetchData('https://bcast.jksons.com:7767/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/jksonsgold'),
        this.fetchData('https://bcast.aaravbullion.in/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/aaravgold'),
        this.fetchData('https://bcast.kakabullion.com:7767/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/kakagold'),
        this.fetchData('https://bcast.karunabullion.com:7767/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/karunagold')
      ]);

      const [
        aaravSilver,
        arihantSilver,
        mantraGold,
        aaravPlatinum,
        arihantPlatinum,
        aaravPalladium,
        arihantPalladium
      ] = await Promise.all([
        this.fetchAaravSilver(),
        this.fetchArihantSilver(),
        this.fetchMantraGold(),
        this.fetchAaravPlatinum(),
        this.fetchArihantPlatinum(),
        this.fetchAaravPalladium(),
        this.fetchArihantPalladium()
      ]);

      return {
        arihantPrices: this.parseArihantData(arihantData),
        jkSonsPrices: this.parseJKSonsData(jkSonsData),
        aaravPrices: this.parseAaravData(aaravData),
        kakaPrices: this.parseKakaData(kakaData),
        karunaPrices: this.parseKarunaData(karunaData),
        aaravSilver,
        arihantSilver,
        mantraGold,
        aaravPlatinum,
        arihantPlatinum,
        aaravPalladium,
        arihantPalladium
      };
    } catch (error) {
      this.logger.error('Failed to fetch market prices:', error.message);
      throw error;
    }
  }

  // Method to update silver price (can be called externally if needed)
  updateSilverPrice(price: number) {
    this.silverPriceINR = price;
  }
} 