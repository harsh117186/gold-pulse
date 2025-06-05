import { IsNotEmpty, IsString } from 'class-validator';

export class FetchFutureMcxResponseDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  expiry: string;
}
