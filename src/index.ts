import { openPage } from './scrape';

export const handler = async (
  event: unknown
): Promise<{ statusCode: number; body: string }> => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  try {
    await openPage('https://www.openreach.com/');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Hello from Lambda',
        input: event,
      }),
    };
  } catch (err) {
    console.error('Error in handler:', err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal error running scraper',
      }),
    };
  }
};
