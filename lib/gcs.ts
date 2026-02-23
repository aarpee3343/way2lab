import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  credentials: JSON.parse(
    Buffer.from(
      process.env.GCP_SERVICE_ACCOUNT!,
      'base64'
    ).toString()
  )
});

export const bucket = storage.bucket(
  process.env.GCP_BUCKET_NAME!
);

export async function uploadEncryptedFile(
  path: string,
  buffer: Buffer
) {
  const file = bucket.file(path);

  await file.save(buffer, {
    resumable: false,
    contentType: 'application/octet-stream'
  });
}

export async function downloadEncryptedFile(path: string) {
  const [data] = await bucket.file(path).download();
  return data;
}

export async function deleteEncryptedFile(path: string) {
  await bucket.file(path).delete({ ignoreNotFound: true });
}

export async function generateSignedUploadUrl(
  path: string,
  contentType: string = 'application/pdf',
  expiresInMinutes: number = 15
) {
  const file = bucket.file(path);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
    contentType
  });

  return url;
}
