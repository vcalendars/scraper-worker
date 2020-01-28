import { AvailableScrapers, Scrape } from '@vcalendars/scrapers';
import { Season, Target } from '@vcalendars/models';
import { Rabbit } from '@danielemeryau/simple-rabbitmq';

import readJsonFromStdin from './src/readJsonFromStdin';
import rabbitEmitter from './src/rabbitEmitter';

interface ScrapeResult {
  succeeded: Season[];
  failed: Target[];
}

let rabbit: Rabbit<Season>;

async function performScrapes(): Promise<ScrapeResult> {
  const configuration = await readJsonFromStdin(5000);
  console.log('Configuration Loaded');
  const availableScrapers = AvailableScrapers();
  const invalidTargets = configuration.targets.filter(
    t => !availableScrapers.includes(t.scraperName),
  );
  const validTargets = configuration.targets.filter(t =>
    availableScrapers.includes(t.scraperName),
  );

  rabbit = new Rabbit<Season>({
    host: process.env.RABBIT_MQ_HOST || 'localhost',
    port: process.env.RABBIT_MQ_PORT || '5672',
    user: process.env.RABBIT_MQ_USER || 'scraper',
    password: process.env.RABBIT_MQ_PASS || 'scraper',
  });
  await rabbit.connect();

  return new Promise(resolve => {
    const successfullyScraped: Season[] = [];

    function handleSeasonCollected(season: Season) {
      successfullyScraped.push(season);
    }

    function handleScrapeError(error: any) {}

    function handleScrapeCompleted() {
      resolve({ succeeded: successfullyScraped, failed: invalidTargets });
    }

    console.log(`Commencing Scrape over ${validTargets.length} valid targets`);
    Scrape({ targets: validTargets })
      .pipe(rabbitEmitter(rabbit, process.env.RABBIT_MQ_EXCHANGE || 'scraper'))
      .subscribe(
        handleSeasonCollected,
        handleScrapeError,
        handleScrapeCompleted,
      );
  });
}

console.log('Scrape Initialising');
performScrapes()
  .then(({ succeeded, failed }) => {
    console.log('Scrape Completed');
    console.log(`${succeeded.length} seasons scraped and emitted successfully`);
    console.log(`${failed.length} targets failed`);
    rabbit.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    rabbit.disconnect();
    process.exit(1);
  });
