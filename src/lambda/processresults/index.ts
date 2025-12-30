import { listS3Objects } from '@/s3Region';
import { convertS3KeyToTimeAndLocation, parseS3Key } from '@/utils';
import { timeAndLocation } from '@/utils';
import { parseResults } from '@/parseResults';
import { downloadS3Object, uploadHtmlToS3 } from '@/s3Region';
import { geolocationData } from '@/geolocationdata';

export const handler = async (event: unknown): Promise<void> => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  const files = await listS3Objects('openreach/');

  const results: Record<
    string,
    {
      geolocation:
        | {
            Postcode: string;
            Description: string;
            'Grid Reference': string;
            'X (easting)': number;
            'Y (northing)': number;
            Latitude: number;
            Longitude: number;
          }
        | undefined;
      timeAndLocation: timeAndLocation;
      status: string;
    }
  > = {};

  files
    .filter((file): file is string => file.endsWith('.html'))
    .map(file => {
      const parsed = parseS3Key(file);
      return convertS3KeyToTimeAndLocation(parsed);
    })
    .forEach(result => {
      if (!results[result.postcode]) {
        results[result.postcode] = {
          timeAndLocation: result,
          status: '',
          geolocation: undefined,
        };
      } else {
        if (result.time > results[result.postcode].timeAndLocation.time) {
          results[result.postcode] = {
            timeAndLocation: result,
            status: '',
            geolocation: undefined,
          };
        }
      }
    });

  for (const [postcode, result] of Object.entries(results)) {
    console.log(`Postcode: ${postcode}, Time: ${result.timeAndLocation.time}`);

    const geolocation = geolocationData.find(
      location => location.Postcode === postcode.replace(' ', '')
    );
    const html = await downloadS3Object(result.timeAndLocation.key);

    const status = await parseResults(html);
    console.log(`Status: ${status}`);
    result.status = status;
    result.geolocation = geolocation;
  }

  await uploadHtmlToS3('results.json', JSON.stringify(results));
};
