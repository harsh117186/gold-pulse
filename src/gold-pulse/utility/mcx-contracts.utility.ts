// src/utility/mcx-contracts.ts

import { FetchFutureMcxResponseDto } from '../dto/fetch-future-mcx-contract.response.dto';

export type Contract = { token: string; name: string; expiry: string };

let goldContracts: FetchFutureMcxResponseDto[] = [
  { token: '445003', name: 'GOLD', expiry: '05DEC2025' },
  { token: '438425', name: 'GOLD', expiry: '05AUG2025' },
  { token: '440939', name: 'GOLD', expiry: '03OCT2025' },
  { token: '435697', name: 'GOLD', expiry: '05JUN2025' },
  { token: '449534', name: 'GOLD', expiry: '05FEB2026' },
  { token: '454818', name: 'GOLD', expiry: '02APR2026' },
];

let silverContracts: FetchFutureMcxResponseDto[] = [
  { token: '439488', name: 'SILVER', expiry: '05SEP2025' },
  { token: '457532', name: 'SILVER', expiry: '05MAY2026' },
  { token: '445004', name: 'SILVER', expiry: '05DEC2025' },
  { token: '436580', name: 'SILVER', expiry: '04JUL2025' },
  { token: '451666', name: 'SILVER', expiry: '05MAR2026' },
];

// Getters
export function getGoldContracts(): FetchFutureMcxResponseDto[] {
  return goldContracts;
}

export function getSilverContracts(): FetchFutureMcxResponseDto[] {
  return silverContracts;
}

// Setters
export function setGoldContracts(contracts: FetchFutureMcxResponseDto[]): void {
  goldContracts = contracts;
}

export function setSilverContracts(
  contracts: FetchFutureMcxResponseDto[],
): void {
  silverContracts = contracts;
}
