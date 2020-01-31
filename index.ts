import { AvailableScrapers, Scrape } from '@vcalendars/scrapers';
import { Season, Target } from '@vcalendars/models';
import { Rabbit, publishObservable } from '@danielemeryau/simple-rabbitmq';
import Logger from '@danielemeryau/logger';

import readJsonFromStdin from './src/readJsonFromStdin';

const logger = new Logger('scraper-worker');
const rabbitLogger = new Logger('scraper-worker/simple-rabbitmq');

interface ScrapeResult {
  succeeded: Season[];
  failed: Target[];
}

let rabbit: Rabbit;

async function performScrapes(): Promise<ScrapeResult> {
  const configuration = await readJsonFromStdin(5000);
  logger.debug('Configuration Loaded');
  const availableScrapers = AvailableScrapers();
  const invalidTargets = configuration.targets.filter(
    t => !availableScrapers.includes(t.scraperName),
  );
  const validTargets = configuration.targets.filter(t =>
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
  await rabbit.connect();

  return new Promise((resolve, reject) => {
    const successfullyScraped: Season[] = [];

    function handleSeasonCollected(season: Season) {
      successfullyScraped.push(season);
    }

    function handleScrapeError(error: any) {
      logger.error(error);
      reject(error);
    }

    function handleScrapeCompleted() {
      resolve({ succeeded: successfullyScraped, failed: invalidTargets });
    }

    logger.info(`Commencing Scrape over ${validTargets.length} valid targets`);
    Scrape({ targets: validTargets })
      .pipe(
        publishObservable(rabbit, process.env.RABBIT_MQ_EXCHANGE || 'scraper'),
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
  .catch(err => {
    logger.error(err);
    rabbit.disconnect();
    process.exit(1);
  });
