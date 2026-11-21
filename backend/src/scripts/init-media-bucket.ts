// One-off MinIO/S3 setup for CAT-05: creates the media bucket and allows
// anonymous GET on objects only (writes stay restricted to the backend).
// Usage: pnpm -C backend media:init
import { existsSync } from 'node:fs';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { readStorageSettings } from '../infrastructure/storage/storage.settings';

if (existsSync('../.env')) process.loadEnvFile('../.env');
if (existsSync('.env')) process.loadEnvFile('.env');

const settings = readStorageSettings(process.env);
if (settings.provider !== 's3' || !settings.endpoint || !settings.accessKeyId) {
  throw new Error('Configure STORAGE_PROVIDER=s3 et les credentials S3 avant media:init.');
}

const client = new S3Client({
  endpoint: settings.endpoint,
  region: settings.region,
  forcePathStyle: settings.forcePathStyle,
  credentials: {
    accessKeyId: settings.accessKeyId,
    secretAccessKey: settings.secretAccessKey ?? '',
  },
});

async function main(): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: settings.bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: settings.bucket }));
    process.stdout.write(`Bucket ${settings.bucket} créé.\n`);
  }

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadProductImages',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${settings.bucket}/*`],
      },
    ],
  };
  await client.send(
    new PutBucketPolicyCommand({
      Bucket: settings.bucket,
      Policy: JSON.stringify(policy),
    }),
  );
  process.stdout.write(`Policy de lecture publique appliquée à ${settings.bucket}.\n`);
}

void main();
