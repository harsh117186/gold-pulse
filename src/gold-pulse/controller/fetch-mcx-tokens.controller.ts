import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { FetchMCXFuturesService } from '../service/fetch-mcx-futures.service.impl';
import { FetchFutureMcxResponseDto } from '../dto/fetch-future-mcx-contract.response.dto';
import {
  setGoldContracts,
  setSilverContracts,
} from '../utility/mcx-contracts.utility';
import { ResponseDto } from '../dto/response.dto';

interface ErrorWithStatus extends Error {
  status?: number;
}

@Controller('mcx-futures')
export class FetchMcxTokensController {
  constructor(
    @Inject()
    private readonly fetchMCXFuturesService: FetchMCXFuturesService,
  ) {}

  @Get('gold')
  async getGoldFutures(): Promise<ResponseDto<FetchFutureMcxResponseDto[]>> {
    try {
      const goldContracts =
        await this.fetchMCXFuturesService.fetchGoldFutures();

      if (!goldContracts || goldContracts.length === 0) {
        throw new HttpException(
          'No gold futures contracts found',
          HttpStatus.NOT_FOUND,
        );
      }

      setGoldContracts(goldContracts);

      return ResponseDto.success<FetchFutureMcxResponseDto[]>(
        'Successfully fetched GOLD futures contracts.',
        HttpStatus.OK,
        goldContracts,
      );
    } catch (err) {
      const error = err as ErrorWithStatus;
      throw new HttpException(
        ResponseDto.failure<string>(
          'Failed to fetch GOLD futures contracts',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error.message || 'Unknown error occurred',
        ),
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('silver')
  async getSilverFutures(): Promise<ResponseDto<FetchFutureMcxResponseDto[]>> {
    try {
      const silverContracts =
        await this.fetchMCXFuturesService.fetchSilverFutures();

      if (!silverContracts || silverContracts.length === 0) {
        throw new HttpException(
          'No silver futures contracts found',
          HttpStatus.NOT_FOUND,
        );
      }

      setSilverContracts(silverContracts);

      return ResponseDto.success<FetchFutureMcxResponseDto[]>(
        'Successfully fetched SILVER futures contracts.',
        HttpStatus.OK,
        silverContracts,
      );
    } catch (err) {
      const error = err as ErrorWithStatus;
      throw new HttpException(
        ResponseDto.failure<string>(
          'Failed to fetch SILVER futures contracts',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error.message || 'Unknown error occurred',
        ),
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
