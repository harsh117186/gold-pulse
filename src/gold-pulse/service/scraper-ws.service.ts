import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
import { WebSocket, WebSocketServer } from 'ws';
import { ScrapedDataResponseDto, ScrapedPriceDto, SilverCostingDto, MantraGoldDto } from '../dto/scraper-price.dto';
import axios from 'axios';

@Injectable()
export class ScraperWebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScraperWebSocketService.name);
  private browser: Browser;
  private deepJewellersPage: Page;
  private pritamSpotPage: Page;
  private wss: WebSocketServer;
  private isRunning: boolean = false;
  private scrapeInterval: NodeJS.Timeout;
  private silverPriceINR: number = 0; // Add this to store silver price

  async onModuleInit() {
    try {
      // Initialize WebSocket server
      this.wss = new WebSocketServer({ port: 8080 });

      // Initialize browser and pages
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.deepJewellersPage = await this.browser.newPage();
      this.pritamSpotPage = await this.browser.newPage();
    } catch (error) {
      this.logger.error('Failed to initialize:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async scrapeDeepJewellers(): Promise<ScrapedPriceDto[]> {
    try {
      await this.deepJewellersPage.goto('http://deepjewellers.co.in', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      await this.deepJewellersPage.waitForSelector('.content-cover table tbody tr', { timeout: 5000 });

      return await this.deepJewellersPage.evaluate(() => {
        const rows = document.querySelectorAll('.content-cover table tbody tr');
        return Array.from(rows).map(row => {
          const productElement = row.querySelector('.main-product-cover h3');
          const rateElement = row.querySelector('.product-rate:not([style*="display:none"]) .bgm.e');
          
          const product = productElement instanceof HTMLElement ? productElement.innerText.trim() : '';
          const rate = rateElement instanceof HTMLElement ? rateElement.innerText.trim() : '';
          
          return { product, rate };
        }).filter(item => item.product && item.rate);
      });
    } catch (error) {
      return [];
    }
  }

  private async scrapePritamSpot(): Promise<ScrapedPriceDto[]> {
    try {
      await this.pritamSpotPage.goto('http://www.pritamspot.com', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      await this.pritamSpotPage.waitForSelector('#divProduct .mprate', { timeout: 5000 });

      return await this.pritamSpotPage.evaluate(() => {
        const rows = document.querySelectorAll('#divProduct .mprate');
        return Array.from(rows).map(row => {
          const productElement = row.querySelector('.product-title-main .product-size');
          const rateElement = row.querySelector('.b2:not([style*="display:none"]) .e, .b2:not([style*="display:none"]) .l');
          
          const product = productElement instanceof HTMLElement ? productElement.innerText.trim() : '';
          const rate = rateElement instanceof HTMLElement ? rateElement.innerText.trim() : '';
          
          return { product, rate };
        }).filter(item => item.product && item.rate);
      });
    } catch (error) {
      return [];
    }
  }

  private async fetchAaravSilver(): Promise<SilverCostingDto[]> {
    try {
      const response = await axios.get('https://bcast.aaravbullion.in/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/aaravsilver');
      const lines: string[] = response.data.split('\n').map((line: string) => line.trim());
      
      return lines
        .filter((line: string) => line.includes('2171'))
        .map((line: string) => {
          const parts = line.split(/\s+/);
          const [costing, buy, sell, high, low] = parts.slice(-5);
          const premium = this.silverPriceINR ? (parseFloat(sell) - this.silverPriceINR).toFixed(2) : 'N/A';
          const withoutGstPremium = this.silverPriceINR ? ((parseFloat(sell) / 1.03) - this.silverPriceINR).toFixed(2) : 'N/A';

          return {
            costing,
            buy,
            sell,
            high,
            low,
            premium,
            withoutGstPremium
          };
        });
    } catch (error) {
      return [];
    }
  }

  private async fetchArihantSilver(): Promise<SilverCostingDto[]> {
    try {
      const response = await axios.get('https://bcast.arihantspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/arihantsilver');
      const lines: string[] = response.data.split('\n').map((line: string) => line.trim());
      
      return lines
        .filter((line: string) => line.includes('SILVER (PREMIUM)'))
        .map((line: string) => {
          const parts = line.split(/\s+/);
          const [costing, buy, sell, high, low] = parts.slice(-5);
          const premium = this.silverPriceINR ? (parseFloat(sell) - this.silverPriceINR).toFixed(2) : 'N/A';
          const withoutGstPremium = this.silverPriceINR ? ((parseFloat(sell) / 1.03) - this.silverPriceINR).toFixed(2) : 'N/A';

          return {
            costing,
            buy,
            sell,
            high,
            low,
            premium,
            withoutGstPremium
          };
        });
    } catch (error) {
      return [];
    }
  }

  private async fetchMantraGold(): Promise<MantraGoldDto | null> {
    try {
      const response = await axios.get('http://bcast.mantragold.net:7767/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/mantragold');
      const lines: string[] = response.data.split('\n').map((line: string) => line.trim());
      
      const goldGstLine = lines.find((line: string) => line.includes('GOLD 999 WITH GST'));
      if (!goldGstLine) return null;

      // Split by whitespace and filter out empty strings
      const parts = goldGstLine.split(/\s+/).filter(part => part.trim() !== '');
      
      // Find all numeric values in the line, excluding "999" which is part of the product name
      const numericValues = parts
        .filter(part => !isNaN(Number(part)) && part.length > 0 && part !== '999')
        .map(Number)  // Convert to numbers to ensure proper sorting
        .sort((a, b) => a - b)  // Sort numerically
        .map(String);  // Convert back to strings

      if (numericValues.length < 4) {
        this.logger.warn('Not enough numeric values found in Mantra Gold data');
        return null;
      }

      // Get the values in the correct order
      const [low, buy, sell, high] = numericValues.slice(-4);

      return {
        product: 'GOLD 999',
        buy: buy || '0',
        sell: sell || '0',
        high: high || '0',
        low: low || '0'
      };
    } catch (error) {
      this.logger.error('Failed to fetch Mantra Gold data:', error.message);
      return null;
    }
  }

  private async startScraping() {
    if (this.scrapeInterval) {
      clearInterval(this.scrapeInterval);
    }

    this.isRunning = true;
    this.scrapeInterval = setInterval(async () => {
      try {
        const [deepJewellers, pritamSpot, aaravSilver, arihantSilver, mantraGold] = await Promise.all([
          this.scrapeDeepJewellers(),
          this.scrapePritamSpot(),
          this.fetchAaravSilver(),
          this.fetchArihantSilver(),
          this.fetchMantraGold()
        ]);

        const liveData: ScrapedDataResponseDto = {
          deepJewellers,
          pritamSpot,
          aaravSilver,
          arihantSilver,
          mantraGold
        };

        this.wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(liveData));
          }
        });
      } catch (error) {
        // Silent error handling for continuous operation
      }
    }, 1000);
  }

  // Public API methods
  async getCurrentData(): Promise<ScrapedDataResponseDto> {
    const [deepJewellers, pritamSpot, aaravSilver, arihantSilver, mantraGold] = await Promise.all([
      this.scrapeDeepJewellers(),
      this.scrapePritamSpot(),
      this.fetchAaravSilver(),
      this.fetchArihantSilver(),
      this.fetchMantraGold()
    ]);

    return {
      deepJewellers,
      pritamSpot,
      aaravSilver,
      arihantSilver,
      mantraGold
    };
  }

  getStatus(): { isRunning: boolean; connectedClients: number } {
    return {
      isRunning: this.isRunning,
      connectedClients: this.wss.clients.size
    };
  }

  startScrapingService(): { success: boolean; message: string } {
    if (this.isRunning) {
      return { success: false, message: 'Scraping service is already running' };
    }

    this.startScraping();
    return { success: true, message: 'Scraping service started' };
  }

  stopScrapingService(): { success: boolean; message: string } {
    if (!this.isRunning) {
      return { success: false, message: 'Scraping service is not running' };
    }

    this.isRunning = false;
    if (this.scrapeInterval) {
      clearInterval(this.scrapeInterval);
    }
    return { success: true, message: 'Scraping service stopped' };
  }

  async cleanup(): Promise<{ success: boolean; message: string }> {
    try {
      this.isRunning = false;
      if (this.scrapeInterval) {
        clearInterval(this.scrapeInterval);
      }
      if (this.wss) {
        this.wss.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      return { success: true, message: 'Cleanup completed successfully' };
    } catch (error) {
      return { success: false, message: 'Error during cleanup: ' + error.message };
    }
  }

  // Method to update silver price (can be called externally if needed)
  updateSilverPrice(price: number) {
    this.silverPriceINR = price;
  }
} 