import {
  Controller,
  Get,
  Post,
  Delete,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { LivePriceServiceImpl } from '../service/live-price.service.impl';
import { ResponseDto } from '../dto/response.dto';
import { FetchLivePriceResponseDto } from '../dto/fetch-live-price.response.dto';
import { PriceStorageService } from '../service/price-storage.service';

interface ErrorWithStatus extends Error {
  status?: number;
}

@Controller()
export class LivePriceController {
  constructor(
    @Inject()
    private readonly livePriceService: LivePriceServiceImpl,
    private readonly priceStorageService: PriceStorageService,
  ) {}

  @Get('refresh/price')
  async getRefreshPrices(): Promise<ResponseDto<FetchLivePriceResponseDto>> {
    try {
      const data = await this.livePriceService.getMCXGoldAndSilverPrice();

      return ResponseDto.success<FetchLivePriceResponseDto>(
        'Successfully fetched live price.',
        HttpStatus.OK,
        data,
      );
    } catch (err) {
      const error = err as ErrorWithStatus;
      throw new HttpException(
        ResponseDto.failure<string>(
          'Failed to fetch live price',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error.message || 'Unknown error occurred',
        ),
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('price')
  async getLatestPrices(): Promise<ResponseDto<FetchLivePriceResponseDto>> {
    try {
      const data = await this.priceStorageService.getLatestPrices();

      if (!data) {
        throw new HttpException(
          'No price data available',
          HttpStatus.NOT_FOUND,
        );
      }

      return ResponseDto.success<FetchLivePriceResponseDto>(
        'Successfully fetched latest MCX prices.',
        HttpStatus.OK,
        data,
      );
    } catch (err) {
      const error = err as ErrorWithStatus;
      throw new HttpException(
        ResponseDto.failure<string>(
          'Failed to fetch MCX prices',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error.message || 'Unknown error occurred',
        ),
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('price/start')
  async startPriceUpdates(): Promise<ResponseDto<string>> {
    try {
      await this.priceStorageService.startUpdating();
      return ResponseDto.success<string>(
        'MCX price update service started successfully.',
        HttpStatus.OK,
        'Service started',
      );
    } catch (error) {
      throw new HttpException(
        ResponseDto.failure<string>(
          'Failed to start MCX price update service',
          HttpStatus.INTERNAL_SERVER_ERROR,
          error.message,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('price/stop')
  stopPriceUpdates(): ResponseDto<string> {
    try {
      this.priceStorageService.stopUpdating();
      return ResponseDto.success<string>(
        'MCX price update service stopped successfully.',
        HttpStatus.OK,
        'Service stopped',
      );
    } catch (error) {
      throw new HttpException(
        ResponseDto.failure<string>(
          'Failed to stop MCX price update service',
          HttpStatus.INTERNAL_SERVER_ERROR,
          error.message,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
