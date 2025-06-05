import { SelectedContractResponseDto } from '../dto/selected-contract.response.dto';

const selectedContract: SelectedContractResponseDto = {
  goldToken: '438425',
  silverToken: '436580',
};

export function getSelectedContract(): SelectedContractResponseDto {
  return selectedContract;
}

export function setGoldToken(token: string): void {
  selectedContract.goldToken = token;
}

export function setSilverToken(token: string): void {
  selectedContract.silverToken = token;
}
