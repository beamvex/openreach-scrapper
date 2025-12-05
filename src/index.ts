import { openPage } from './scrape';

export const handler = async (
  event: unknown
): Promise<{ statusCode: number; body: string }> => {
  await openPage('https://www.openreach.com/');

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda',
      input: event,
    }),
  };
};
