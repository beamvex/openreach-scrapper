import { listS3Objects } from '@/s3Region';
import { convertS3KeyToTimeAndLocation, parseS3Key } from '@/utils';
import { timeAndLocation } from '@/utils';

export const handler = async (event: unknown): Promise<void> => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  const files = await listS3Objects('openreach/');

  const results: Record<string, timeAndLocation> = {};

  files
    .filter((file): file is string => file.endsWith('.html'))
    .map(file => {
      const parsed = parseS3Key(file);
      return convertS3KeyToTimeAndLocation(parsed);
    })
    .forEach(result => {
      if (!results[result.postcode]) {
        results[result.postcode] = result;
      } else {
        if (result.time > results[result.postcode].time) {
          results[result.postcode] = result;
        }
      }
    });

  console.log('Results: ', JSON.stringify(results, null, 2));
};
