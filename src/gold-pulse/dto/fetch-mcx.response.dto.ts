import { IsNotEmpty, IsNumber } from 'class-validator';

export class FetchMCXResponseDto {
  @IsNotEmpty()
  @IsNumber()
  gold: number;

  @IsNotEmpty()
  @IsNumber()
  silver: number;
}
