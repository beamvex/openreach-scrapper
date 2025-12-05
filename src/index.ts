import { openPage } from './scrape';

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

export const main = async (): Promise<void> => {
  await openPage('https://www.openreach.com/');
};

main().catch(console.error);

