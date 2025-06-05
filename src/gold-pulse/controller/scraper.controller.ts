import { Controller, Get, Post, Delete } from '@nestjs/common';
import { ScraperWebSocketService } from '../service/scraper-ws.service';
import { ScrapedDataResponseDto } from '../dto/scraper-price.dto';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperWebSocketService) {}

  @Get()
  async getScrapedData(): Promise<ScrapedDataResponseDto> {
    return this.scraperService.getCurrentData();
  }

  @Get('status')
  getStatus(): { isRunning: boolean; connectedClients: number } {
    return this.scraperService.getStatus();
  }

  @Post('start')
  startScraping(): { success: boolean; message: string } {
    return this.scraperService.startScrapingService();
  }

  @Post('stop')
  stopScraping(): { success: boolean; message: string } {
    return this.scraperService.stopScrapingService();
  }

  @Delete()
  async cleanup(): Promise<{ success: boolean; message: string }> {
    return this.scraperService.cleanup();
  }
} 