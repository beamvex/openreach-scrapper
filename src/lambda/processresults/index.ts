import { listS3Objects } from '@/s3Region';
import { convertS3KeyToTimeAndLocation, parseS3Key } from '@/utils';
import { timeAndLocation } from '@/utils';
import { parseResults } from '@/parseResults';
import { downloadS3Object, uploadHtmlToS3 } from '@/s3Region';
import { geolocationData } from '@/geodata';

function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase();
}

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
    .filter(file => file.key.endsWith('.html'))
    .map(file => {
      const parsed = parseS3Key(file.key);
      return convertS3KeyToTimeAndLocation(parsed, file.lastModified ?? new Date());
    })
    .forEach(result => {
      if (result.postcode === 'undefined undefined') {
        console.error(`Invalid postcode: ${result.postcode}`);
        return;
      }
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

    const feature = geolocationData.features.find(
      f => normalizePostcode(`${f?.properties?.PCDS ?? ''}`) === normalizePostcode(postcode)
    );
    const coords = feature?.geometry?.coordinates;
    const geolocation = coords
      ? {
          Postcode: normalizePostcode(postcode),
          Description: '',
          'Grid Reference': '',
          'X (easting)': 0,
          'Y (northing)': 0,
          Latitude: coords[1],
          Longitude: coords[0],
        }
      : undefined;
    const html = await downloadS3Object(result.timeAndLocation.key);

    const status = await parseResults(html);
    console.log(`Status: ${status}`);
    result.status = status;
    result.geolocation = geolocation;
  }

  await uploadHtmlToS3('results.json', JSON.stringify(results));
};
