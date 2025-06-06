import * as fs from 'fs';
import * as path from 'path';
import lockfile from 'proper-lockfile';
import { FetchImageResponseDto } from '../dto/fetch-image.response.dto';
import { Logger } from '@nestjs/common';
import { FetchLivePriceResponseDto } from '../dto/fetch-live-price.response.dto';

const logger = new Logger('GlobalUtility');

interface PriceData {
  goldWithoutGst: number;
  silverWithoutGst: number;
  goldPrice24Carat: number;
  silverPricePerKG: number;
  goldPrice22Carat: number;
  goldPrice18Carat: number;
}

export function add3PercentGSTToMCXPrice(price: number): number {
  return price * 1.03;
}

export function calculate22CaratPrice(price24Carat: number): number {
  return (price24Carat * 22) / 24;
}

export function calculate18CaratPrice(price24Carat: number): number {
  return (price24Carat * 18) / 24;
}

async function ensureFileExists(filePath: string): Promise<void> {
  const dirPath = path.dirname(filePath);
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    try {
      await fs.promises.access(filePath);
    } catch (err) {
      // File doesn't exist, create it with empty object
      await fs.promises.writeFile(filePath, '{}', 'utf8');
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error('Failed to ensure file exists:', error.message);
    throw error;
  }
}

export async function updatePriceData(
  goldWithoutGst: number,
  silverWithoutGst: number,
  goldPrice24Carat: number,
  silverPricePerKG: number,
  goldPrice22Carat: number,
  goldPrice18Carat: number,
): Promise<void> {
  const priceData: PriceData = {
    goldWithoutGst,
    silverWithoutGst,
    goldPrice24Carat,
    silverPricePerKG,
    goldPrice22Carat,
    goldPrice18Carat,
  };

  const filePath = path.join(process.cwd(), 'data', 'price-data.json');

  try {
    // Ensure file exists before attempting to lock it
    await ensureFileExists(filePath);

    // Initialize release function
    let release: (() => Promise<void>) | undefined;

    try {
      // Acquire a lock
      release = await lockfile.lock(filePath, { retries: 5 });

      // Write the data
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(priceData, null, 2),
        'utf8',
      );
    } finally {
      // Release the lock if it was acquired
      if (release) {
        await release();
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error('Failed to update price data:', error.message);
    throw error;
  }
}

export async function readPriceData(): Promise<FetchLivePriceResponseDto | null> {
  const filePath = path.join(process.cwd(), 'data', 'price-data.json');

  try {
    // Ensure file exists before attempting to read it
    await ensureFileExists(filePath);

    // Initialize release function
    let release: (() => Promise<void>) | undefined;

    try {
      // Acquire a lock for reading
      release = await lockfile.lock(filePath, { retries: 5 });

      // Read the data
      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data) as FetchLivePriceResponseDto;
    } finally {
      // Release the lock if it was acquired
      if (release) {
        await release();
      }
    }
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error('Failed to read price data:', error.message);
    throw error;
  }
}

export async function writeImageDataToFile(
  images: FetchImageResponseDto[],
): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'image-data.json');

  try {
    // Ensure file exists before attempting to write
    await ensureFileExists(filePath);

    // Initialize release function
    let release: (() => Promise<void>) | undefined;

    try {
      // Acquire a lock
      release = await lockfile.lock(filePath, { retries: 5 });
      
      // Prepare safe-to-serialize data
      const plainImages = images.map((img) => ({
        ...img,
      }));

      // Write the data
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(plainImages, null, 2),
        'utf8',
      );
    } finally {
      // Release the lock if it was acquired
      if (release) {
        await release();
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logger.error('Failed to write image data file:', error.message);
    throw error;
  }
}
