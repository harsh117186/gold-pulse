import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { FetchValidGoldAndSilverTokenServiceImpl } from '../service/fetch-valid-goldAndSilver-token.service.impl';
import {
  setGoldToken,
  setSilverToken,
} from '../utility/selected-contracts.utility';
import { ResponseDto } from '../dto/response.dto';

interface TokenUpdateResult {
  goldToken?: string;
  silverToken?: string;
}

interface ErrorWithStatus extends Error {
  status?: number;
}

@Controller('update-token')
export class UpdateMcxTokenController {
  private readonly logger = new Logger(UpdateMcxTokenController.name);

  constructor(
    @Inject()
    private readonly fetchValidGoldTokenService: FetchValidGoldAndSilverTokenServiceImpl,
  ) {}

  @Get()
  async updateMcxTokens(): Promise<ResponseDto<TokenUpdateResult>> {
    try {
      this.logger.debug('Manual token update triggered');

      const goldToken =
        this.fetchValidGoldTokenService.getLatestValidGoldToken();
      const silverToken =
        this.fetchValidGoldTokenService.getLatestValidSilverToken();

      const result: TokenUpdateResult = {};

      if (goldToken) {
        setGoldToken(goldToken);
        result.goldToken = goldToken;
        this.logger.log(`✅ Set new GOLD token: ${goldToken}`);
      } else {
        this.logger.warn('❌ No valid GOLD token found to set');
      }

      if (silverToken) {
        setSilverToken(silverToken);
        result.silverToken = silverToken;
        this.logger.log(`✅ Set new SILVER token: ${silverToken}`);
      } else {
        this.logger.warn('❌ No valid SILVER token found to set');
      }

      if (!goldToken && !silverToken) {
        throw new HttpException('No valid tokens found', HttpStatus.NOT_FOUND);
      }

      return ResponseDto.success<TokenUpdateResult>(
        'Successfully updated tokens.',
        HttpStatus.OK,
        result,
      );
    } catch (err) {
      const error = err as ErrorWithStatus;
      this.logger.error(
        '❌ Failed to update tokens:',
        error.message || 'Unknown error',
      );
      throw new HttpException(
        ResponseDto.failure<string>(
          'Failed to update tokens',
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error.message || 'Unknown error occurred',
        ),
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
