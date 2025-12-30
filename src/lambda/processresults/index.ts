import { listS3Objects } from '@/s3Region';

export const handler = async (event: unknown): Promise<void> => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  const files = await listS3Objects('openreach/');

  console.log('Files: ', files);
};
