import { flatMap } from 'rxjs/operators';

import { Season } from '@vcalendars/models';

import rabbitmq from './rabbitmq';

async function emitSeasonToRabbit(
  season: Season,
  exchange: string,
): Promise<undefined> {
  rabbitmq.publish(exchange, '', season);
  return Promise.resolve(undefined);
}

export default function rabbitEmitter(exchange: string) {
  return flatMap(async (season: Season) => {
    await emitSeasonToRabbit(season, exchange);
    return season;
  });
}
