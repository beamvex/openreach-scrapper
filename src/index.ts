export const handler = async (
  event: unknown
): Promise<{ statusCode: number; body: string }> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda',
      input: event,
    }),
  };
};
import { openPage } from './scrape';

export const main = async (): Promise<void> => {
  await openPage('https://example.com');
};
