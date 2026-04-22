import { mkdir, writeFile, unlink } from 'fs/promises';
import { createWriteStream, createReadStream } from 'node:fs';
import { join, posix, isAbsolute, dirname, extname } from 'path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export const storagePaths = {
  publicRoot: join(process.cwd(), 'public'),
  uploadsRoot: join(process.cwd(), 'public', 'uploads'),
  originalsDir: join(process.cwd(), 'public', 'uploads', 'videos'),
  clipsDir: join(process.cwd(), 'public', 'uploads', 'clips'),
};

export async function ensureDirectory(path: string) {
  await mkdir(path, { recursive: true });
}

export function buildUploadsPath(...segments: string[]) {
  return posix.join(...segments);
}

export function toPublicUrl(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return posix.join('/', normalized);
}

export function resolveStoredPath(pathOrUrl: string) {
  if (!pathOrUrl) {
    throw new Error('Path or URL cannot be empty or null');
  }

  if (isAbsolute(pathOrUrl)) {
    return pathOrUrl;
  }

  const sanitized = pathOrUrl.replace(/\\/g, '/').replace(/^\/+/, '');
  return join(storagePaths.publicRoot, sanitized);
}

// ============================================================================
// Storage Abstraction
// ============================================================================

export interface StorageProvider {
  /** Write a Buffer or Readable stream to the given relative path and return its public URL. */
  save(data: Buffer | Readable, relativePath: string): Promise<string>;
  /** Delete the file at the given relative path. Resolves silently if not found. */
  delete(relativePath: string): Promise<void>;
  /** Return the public-facing URL for a stored relative path. */
  getPublicUrl(relativePath: string): string;
}

class LocalStorageProvider implements StorageProvider {
  async save(data: Buffer | Readable, relativePath: string): Promise<string> {
    const absolutePath = resolveStoredPath(relativePath);
    await ensureDirectory(dirname(absolutePath));
    if (Buffer.isBuffer(data)) {
      await writeFile(absolutePath, data);
    } else {
      await pipeline(data, createWriteStream(absolutePath));
    }
    return this.getPublicUrl(relativePath);
  }

  async delete(relativePath: string): Promise<void> {
    const absolutePath = resolveStoredPath(relativePath);
    await unlink(absolutePath).catch(() => undefined);
  }

  getPublicUrl(relativePath: string): string {
    return toPublicUrl(relativePath);
  }
}

function mimeFromPath(path: string): string {
  switch (extname(path).toLowerCase()) {
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.mov': return 'video/quicktime';
    case '.mp3': return 'audio/mpeg';
    default: return 'application/octet-stream';
  }
}

class R2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET_NAME;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey || !publicUrl) {
      throw new Error(
        'R2 storage requires R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL'
      );
    }

    this.bucket = bucket;
    this.publicUrl = publicUrl.replace(/\/$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async save(data: Buffer | Readable, relativePath: string): Promise<string> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: relativePath,
        Body: data,
        ContentType: mimeFromPath(relativePath),
      },
    });
    await upload.done();
    return this.getPublicUrl(relativePath);
  }

  async delete(relativePath: string): Promise<void> {
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: relativePath }))
      .catch(() => undefined);
  }

  getPublicUrl(relativePath: string): string {
    return `${this.publicUrl}/${relativePath}`;
  }
}

function createStorageProvider(): StorageProvider {
  if (process.env.R2_ACCOUNT_ID) {
    return new R2StorageProvider();
  }
  return new LocalStorageProvider();
}

export const storageProvider: StorageProvider = createStorageProvider();

// ============================================================================
// Video path resolution — returns a local file path usable by FFmpeg.
// For R2 URLs, downloads the file to a temp path. Caller must invoke cleanup().
// ============================================================================

export async function resolveVideoPath(
  originalUrl: string
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
    const tempPath = join(tmpdir(), `${randomUUID()}.mp4`);
    const response = await fetch(originalUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to download video from storage: HTTP ${response.status}`);
    }
    await pipeline(
      Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(tempPath)
    );
    return { path: tempPath, cleanup: () => unlink(tempPath).catch(() => undefined) };
  }
  const localPath = resolveStoredPath(originalUrl.replace(/^\//, ''));
  return { path: localPath, cleanup: () => Promise.resolve() };
}

export { createReadStream };
