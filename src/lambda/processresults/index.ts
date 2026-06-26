import { listS3Objects } from '@/s3Region';
import { convertS3KeyToTimeAndLocation, parseS3Key } from '@/utils';
import { timeAndLocation } from '@/utils';
import { parseResults } from '@/parseResults';
import { downloadS3Object, uploadHtmlToS3 } from '@/s3Region';
import { geolocationData } from '@/geodata';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase();
}

function formatPostcode(postcode: string): string {
  const normalized = normalizePostcode(postcode);
  if (normalized.length <= 3) {
    return normalized;
  }
  return `${normalized.slice(0, -3)} ${normalized.slice(-3)}`;
}

type ResultEntry = {
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
  timeAndLocation?: timeAndLocation;
  status: string;
  queried: boolean;
};

function getAllPostcodes(): string[] {
  return Array.from(
    new Set(
      (geolocationData.features ?? [])
        .map(feature => `${feature?.properties?.PCDS ?? ''}`)
        .map(pc => pc.replace(/\s+/g, '').toUpperCase())
        .filter(Boolean)
    )
  );
}

function getGeolocation(postcode: string): ResultEntry['geolocation'] {
  const feature = geolocationData.features.find(
    f => normalizePostcode(`${f?.properties?.PCDS ?? ''}`) === normalizePostcode(postcode)
  );
  const coords = feature?.geometry?.coordinates;
  return coords
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
}

function parseExistingResults(existingJson: string): Record<string, ResultEntry> {
  if (!existingJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(existingJson) as Record<string, ResultEntry>;
    return parsed ?? {};
  } catch (err) {
    console.warn('Failed to parse existing results.json; continuing with empty baseline', err);
    return {};
  }
}

async function notifyIfChanged(
  oldResults: Record<string, ResultEntry>,
  newResults: Record<string, ResultEntry>
): Promise<void> {
  const topicArn = process.env.ADDRESS_CHANGE_TOPIC_ARN;
  const region = process.env.SNS_REGION ?? process.env.AWS_REGION;

  if (!topicArn) {
    console.log('ADDRESS_CHANGE_TOPIC_ARN not set; skipping change notifications');
    return;
  }
  if (!region) {
    console.log('SNS_REGION/AWS_REGION not set; skipping change notifications');
    return;
  }

  const sns = new SNSClient({ region });

  const changes: Array<{
    postcode: string;
    from?: { status?: string; queried?: boolean };
    to?: { status?: string; queried?: boolean };
  }> = [];

  for (const [postcode, to] of Object.entries(newResults)) {
    const from = oldResults[postcode];

    if (!from) {
      continue;
    }

    const statusChanged = (from.status ?? '') !== (to.status ?? '');
    const queriedChanged = Boolean(from.queried) !== Boolean(to.queried);

    if (statusChanged || queriedChanged) {
      changes.push({
        postcode,
        from: { status: from.status, queried: from.queried },
        to: { status: to.status, queried: to.queried },
      });
    }
  }

  if (changes.length === 0) {
    return;
  }

  await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Subject: `openreach-scrapper: ${changes.length} changes detected`,
      Message: JSON.stringify(
        {
          changes,
        },
        null,
        2
      ),
    })
  );
}

export const handler = async (event: unknown): Promise<void> => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  const existingResultsJson = await downloadS3Object('results.json');
  const oldResults = parseExistingResults(existingResultsJson);

  const files = await listS3Objects('openreach/');

  const results: Record<string, ResultEntry> = {};

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
          queried: true,
        };
      } else {
        const existingTime = results[result.postcode].timeAndLocation?.time;
        if (!existingTime || result.time > existingTime) {
          results[result.postcode] = {
            timeAndLocation: result,
            status: '',
            geolocation: undefined,
            queried: true,
          };
        }
      }
    });

  for (const postcode of getAllPostcodes()) {
    const formatted = formatPostcode(postcode);
    if (!results[formatted]) {
      results[formatted] = {
        status: 'not_queried_yet',
        geolocation: getGeolocation(formatted),
        queried: false,
      };
    }
  }

  for (const [postcode, result] of Object.entries(results)) {
    const timestamp = result.timeAndLocation?.time;
    console.log(`Postcode: ${postcode}, Time: ${timestamp ?? 'n/a'}`);

    result.geolocation = result.geolocation ?? getGeolocation(postcode);

    if (!result.queried || !result.timeAndLocation?.key) {
      continue;
    }

    const html = await downloadS3Object(result.timeAndLocation.key);
    const status = await parseResults(html);
    console.log(`Status: ${status}`);
    result.status = status;
  }

  await notifyIfChanged(oldResults, results);

  await uploadHtmlToS3('results.json', JSON.stringify(results));
};
