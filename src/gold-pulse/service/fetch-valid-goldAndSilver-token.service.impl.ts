import { Injectable } from '@nestjs/common';
import {
  getGoldContracts,
  getSilverContracts,
} from '../utility/mcx-contracts.utility';

interface MCXContract {
  token: string;
  expiry: string;
}

@Injectable()
export class FetchValidGoldAndSilverTokenServiceImpl {
  private parseExpiry(expiry: string): Date {
    const monthMap: { [key: string]: number } = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11,
    };

    const day = expiry.substring(0, 2);
    const mon = expiry.substring(2, 5);
    const year = '20' + expiry.substring(5);

    return new Date(parseInt(year), monthMap[mon], parseInt(day));
  }

  private getValidGoldTokens(): MCXContract[] {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return getGoldContracts()
      .filter((item) => this.parseExpiry(item.expiry) > sevenDaysFromNow)
      .sort((a, b) => {
        const dateA = this.parseExpiry(a.expiry);
        const dateB = this.parseExpiry(b.expiry);
        return dateA.getTime() - dateB.getTime();
      });
  }

  private getValidSilverTokens(): MCXContract[] {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return getSilverContracts()
      .filter((item) => this.parseExpiry(item.expiry) > sevenDaysFromNow)
      .sort((a, b) => {
        const dateA = this.parseExpiry(a.expiry);
        const dateB = this.parseExpiry(b.expiry);
        return dateA.getTime() - dateB.getTime();
      });
  }

  getLatestValidGoldToken(): string | null {
    const validTokens = this.getValidGoldTokens();
    return validTokens.length > 0 ? validTokens[0].token : null;
  }

  getLatestValidSilverToken(): string | null {
    const validTokens = this.getValidSilverTokens();
    return validTokens.length > 0 ? validTokens[0].token : null;
  }
}
