import { AvailableScrapers, Scrape } from '@teamest/scrapers';
import { Configuration, Target } from '@teamest/models/raw';
import { ScrapedSeasonMessage } from '@teamest/models/messages';
import { Rabbit, publishObservable } from '@danielemeryau/simple-rabbitmq';
import { Logger } from '@danielemeryau/logger';

import readJsonFromStdin from './src/readJsonFromStdin';
import createMessage from './src/createMessage';
import configurationSchema from './src/configuration.schema';
import { ScrapeError } from './src/errors';

const logger = new Logger('scraper-worker');
const rabbitLogger = new Logger('scraper-worker/simple-rabbitmq');

const FIVE_MINUTES_MILLIS = 5 * 60 * 1000;
const TEN_SECONDS_MILLIS = 10 * 1000;

interface ScrapeResult {
  succeeded: ScrapedSeasonMessage[];
  failed: Target[];
}

let rabbit: Rabbit;

async function performScrapes(): Promise<ScrapeResult> {
  const configuration = await readJsonFromStdin<Configuration>(
    5000,
    configurationSchema,
  );
  logger.debug('Configuration Loaded');
  const availableScrapers = AvailableScrapers();
  const invalidTargets = configuration.targets.filter(
    (t) => !availableScrapers.includes(t.scraperName),
  );
  const validTargets = configuration.targets.filter((t) =>
    availableScrapers.includes(t.scraperName),
  );

  rabbit = new Rabbit(
    {
      host: process.env.RABBIT_MQ_HOST || 'localhost',
      port: process.env.RABBIT_MQ_PORT || '5672',
      user: process.env.RABBIT_MQ_USER || 'scraper',
      password: process.env.RABBIT_MQ_PASS || 'scraper',
    },
    rabbitLogger,
  );
  await rabbit.connect({
    retry: true,
    retryWait: TEN_SECONDS_MILLIS,
    timeoutMillis: FIVE_MINUTES_MILLIS,
  });

  return new Promise((resolve, reject) => {
    const successfullyScraped: ScrapedSeasonMessage[] = [];

    function handleSeasonCollected(season: ScrapedSeasonMessage) {
      successfullyScraped.push(season);
    }

    function handleScrapeError(error: unknown) {
      if (error instanceof ScrapeError) {
        logger.error(error.message, error.context);
      } else {
        logger.error('Unhandled error occurred', error);
      }
      reject(error);
    }

    function handleScrapeCompleted() {
      resolve({ succeeded: successfullyScraped, failed: invalidTargets });
    }

    logger.info(`Commencing Scrape over ${validTargets.length} valid targets`);
    Scrape({ targets: validTargets })
      .pipe(
        createMessage(),
        publishObservable<ScrapedSeasonMessage>(
          rabbit,
          process.env.RABBIT_MQ_EXCHANGE || 'scraper',
        ),
      )
      .subscribe(
        handleSeasonCollected,
        handleScrapeError,
        handleScrapeCompleted,
      );
  });
}

logger.info('Scrape Initialising');
performScrapes()
  .then(async ({ succeeded, failed }) => {
    logger.info('Scrape Completed');
    logger.info(`${succeeded.length} seasons scraped and emitted successfully`);
    logger.info(`${failed.length} targets failed`);
    await rabbit.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    rabbit?.disconnect();
    process.exit(1);
  });
