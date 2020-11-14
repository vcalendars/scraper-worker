import { map } from 'rxjs/operators';
import { ScrapedSeason } from '@teamest/models/processed';
import { ScrapedSeasonMessage } from '@teamest/models/messages';
import { OperatorFunction } from 'rxjs';

const MESSAGE_VERSION = 'v1.0';

export default function createMessage(): OperatorFunction<ScrapedSeason, ScrapedSeasonMessage> {
  return map<ScrapedSeason, ScrapedSeasonMessage>(
    ({ season }) => ({
      season,
      timeScraped: new Date(),
      version: MESSAGE_VERSION,
    }),
  );
}
