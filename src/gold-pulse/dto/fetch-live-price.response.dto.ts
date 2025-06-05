import { IsNotEmpty, IsNumber } from 'class-validator';

export class FetchLivePriceResponseDto {
  @IsNotEmpty()
  @IsNumber()
  gold: number;

  @IsNotEmpty()
  @IsNumber()
  silver: number;
}
