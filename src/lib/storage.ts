import { mkdir } from 'fs/promises';
import { join, posix, isAbsolute } from 'path';

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
