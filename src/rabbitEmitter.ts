import { flatMap } from 'rxjs/operators';

import { Season } from '@vcalendars/models';
import { Rabbit } from '@danielemeryau/simple-rabbitmq';
import Logger from '@danielemeryau/logger';

export default function rabbitEmitter(
  rabbit: Rabbit<Season>,
  exchange: string,
  logger: Logger,
) {
  return flatMap(async (season: Season) => {
    try {
      await rabbit.publish(exchange, '', season);
      logger.debug(`Season <${season.name}> emitted`);
    } catch (err) {
      logger.error(`Season <${season.name}> failed`, err);
    }
    return season;
  });
}
