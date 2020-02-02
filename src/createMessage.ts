import { map } from 'rxjs/operators';
import { ScrapedSeason } from '@vcalendars/models/processed';
import { ScrapedSeasonMessage } from '@vcalendars/models/messages';

const MESSAGE_VERSION = 'v1.0';

export default function createMessage() {
  return map<ScrapedSeason, ScrapedSeasonMessage>(
    ({ season, sourceTarget }) => ({
      season,
      timeScraped: new Date(),
      matchDuration: sourceTarget.matchDuration,
      timezone: sourceTarget.timezone,
      version: MESSAGE_VERSION,
    }),
  );
}
