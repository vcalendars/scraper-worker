import { AvailableScrapers, Scrape } from '@vcalendars/scrapers';

import readJsonFromStdin from './src/readJsonFromStdin';
import { Season, Target } from '@vcalendars/models';
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
      .pipe(rabbitEmitter())
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
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
