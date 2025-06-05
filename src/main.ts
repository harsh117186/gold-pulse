import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors(); // Enable CORS for all origins
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
  } catch (err) {
    const error = err as Error;
    logger.error('Failed to start application:', error.message);
    process.exit(1);
  }
}

void bootstrap();
