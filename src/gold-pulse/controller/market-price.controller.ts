import { Controller, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MarketPriceService } from '../service/market-price.service';
import { MarketPriceResponseDto } from '../dto/market-price.dto';
import { ResponseDto } from '../dto/response.dto';

@Controller('market-prices')
export class MarketPriceController {
  private readonly logger = new Logger(MarketPriceController.name);

  constructor(private readonly marketPriceService: MarketPriceService) {}

  @Get()
  async getAllMarketPrices(): Promise<ResponseDto<MarketPriceResponseDto>> {
    try {
      const data = await this.marketPriceService.fetchAllMarketPrices();
      return ResponseDto.success<MarketPriceResponseDto>(
        'Successfully fetched market prices',
        200,
        data
      );
    } catch (error) {
      this.logger.error('Failed to fetch market prices:', error.message);
      throw new HttpException(
        ResponseDto.failure<string>(
          'Failed to fetch market prices',
          500,
          error.message
        ),
        500
      );
    }
  }
} 