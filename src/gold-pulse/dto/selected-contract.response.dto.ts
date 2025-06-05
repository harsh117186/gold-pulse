import { IsNotEmpty, IsString } from 'class-validator';

export class SelectedContractResponseDto {
  @IsNotEmpty()
  @IsString()
  goldToken: string;

  @IsNotEmpty()
  @IsString()
  silverToken: string;
}
