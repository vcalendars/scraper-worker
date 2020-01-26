import { flatMap } from 'rxjs/operators';

import { Season } from '@vcalendars/models';

async function emitSeasonToRabbit(season: Season): Promise<undefined> {
  // TODO Emit to rabbit
  console.log('Successfully emiting season to rabbit!');
  return Promise.resolve(undefined);
}

export default function rabbitEmitter() {
  return flatMap(async (season: Season) => {
    await emitSeasonToRabbit(season);
    return season;
  });
}
