import { flatMap } from 'rxjs/operators';

import { Season } from '@vcalendars/models';
import { Rabbit } from '@danielemeryau/simple-rabbitmq';

export default function rabbitEmitter(
  rabbit: Rabbit<Season>,
  exchange: string,
) {
  return flatMap(async (season: Season) => {
    console.log(`Preparing to emit ${season.name}`);
    try {
      await rabbit.publish(exchange, '', season);
      console.log(`Season ${season.name} emitted`);
    } catch (err) {
      console.error(`Season ${season.name} failed`, err);
    }
    return season;
  });
}
