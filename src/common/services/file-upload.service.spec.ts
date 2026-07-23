import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileUploadService } from './file-upload.service';

describe('FileUploadService media URL normalization', () => {
  const originalAppUrl = process.env.APP_URL;
  const originalUploadDir = process.env.UPLOAD_DIR;
  const uploadDir = path.join(
    os.tmpdir(),
    `pearson-file-upload-${process.pid}-${Date.now()}`,
  );
  let service: FileUploadService;

  beforeAll(() => {
    process.env.APP_URL = 'https://api.thepearsonpubwhitby.ca/';
    process.env.UPLOAD_DIR = uploadDir;
    service = new FileUploadService();
  });

  afterAll(() => {
    if (originalAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = originalAppUrl;

    if (originalUploadDir === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = originalUploadDir;

    fs.rmSync(uploadDir, { recursive: true, force: true });
  });

  it('replaces a persisted localhost upload origin', async () => {
    await expect(
      service.getSignedUrl(
        'http://localhost:5000/uploads/specials/example.jpeg',
      ),
    ).resolves.toBe(
      'https://api.thepearsonpubwhitby.ca/uploads/specials/example.jpeg',
    );
  });

  it('publishes relative upload paths from APP_URL', async () => {
    await expect(
      service.getSignedUrl('/uploads/events/example.webp?version=2'),
    ).resolves.toBe(
      'https://api.thepearsonpubwhitby.ca/uploads/events/example.webp?version=2',
    );
  });

  it('preserves external and inline media URLs', async () => {
    await expect(
      service.getMultipleSignedUrls([
        'https://cdn.example.com/images/example.jpg',
        'data:image/png;base64,example',
      ]),
    ).resolves.toEqual([
      'https://cdn.example.com/images/example.jpg',
      'data:image/png;base64,example',
    ]);
  });
});
