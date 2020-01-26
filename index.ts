import { AvailableScrapers, Scrape } from '@vcalendars/scrapers';

import readJsonFromStdin from './src/readJsonFromStdin';
import { Season, Target } from '@vcalendars/models';
import rabbit from './src/rabbitmq';
import rabbitEmitter from './src/rabbitEmitter';

interface ScrapeResult {
  succeeded: Season[];
  failed: Target[];
}

async function performScrapes(): Promise<ScrapeResult> {
  const failed = [];
  const configuration = await readJsonFromStdin(5000);
  const availableScrapers = AvailableScrapers();
  const invalidTargets = configuration.targets.filter(
    t => !availableScrapers.includes(t.scraperName),
  );
  const validTargets = configuration.targets.filter(t =>
    availableScrapers.includes(t.scraperName),
  );

  await rabbit.configureRabbitMQ(
    process.env.RABBIT_MQ_HOST || 'localhost',
    process.env.RABBIT_MQ_PORT || '5672',
    process.env.RABBIT_MQ_USER || 'scraper',
    process.env.RABBIT_MQ_PASS || 'scraper',
  );

  return new Promise((resolve, reject) => {
    const successfullyScraped: Season[] = [];

    function handleSeasonCollected(season: Season) {
      successfullyScraped.push(season);
    }

    function handleScrapeError(error: any) {}

    function handleScrapeCompleted() {
      resolve({ succeeded: successfullyScraped, failed: invalidTargets });
    }

    Scrape({ targets: validTargets })
      .pipe(rabbitEmitter(process.env.RABBIT_MQ_EXCHANGE || 'scraper'))
      .subscribe(
        handleSeasonCollected,
        handleScrapeError,
        handleScrapeCompleted,
      );
  });
}

performScrapes()
  .then(({ succeeded, failed }) => {
    console.log('Scrape Completed');
    console.log(`${succeeded.length} seasons scraped and emitted successfully`);
    console.log(`${failed.length} targets failed`);
    rabbit.disconnectRabbitMQ();
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    rabbit.disconnectRabbitMQ();
    process.exit(1);
  });
